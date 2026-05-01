import csv
import io
import re
import datetime
from datetime import datetime as dt
from decimal import Decimal, InvalidOperation
from datetime import date
from django.db import transaction
from rest_framework.response import Response

from tenants.models import AcademicYear, Branch
from students.models import ClassSection, Student, GRADE_CHOICES
from fees.models import FeeInvoice, Payment, FeeCarryForward, DocumentSequence
from .services import create_student_fees, link_parent_accounts_to_student


def handle_csv_import(request):
    """
    Handles bulk student CSV import with PARTIAL SUCCESS support.
    - Good rows are imported and committed immediately.
    - Bad rows are skipped and their exact errors are collected.
    - Final response shows imported count, skipped duplicates, and per-row errors.
    """
    try:
        user = request.user
        branch_id = request.data.get('branch_id')
        academic_year_id = request.data.get('academic_year_id')
        file_obj = request.FILES.get('file')

        if not file_obj or not file_obj.name.endswith('.csv'):
            return Response({'success': False, 'detail': 'Please upload a valid CSV file.'}, status=400)

        # Handle 'undefined' and empty strings from FormData
        if branch_id in ['undefined', '']: branch_id = None
        if academic_year_id in ['undefined', '']: academic_year_id = None

        try:
            if user.role == 'SUPER_ADMIN':
                if not branch_id:
                    return Response({'success': False, 'detail': 'SUPER_ADMIN must provide a branch_id.'}, status=400)
                branch = Branch.objects.get(id=branch_id)
                tenant = branch.tenant
            else:
                branch = Branch.objects.get(id=branch_id, tenant=user.tenant) if branch_id else user.branch
                if not branch:
                    return Response({'success': False, 'detail': 'No branch associated with your account.'}, status=400)
                tenant = user.tenant

            if academic_year_id:
                ay = AcademicYear.objects.get(id=academic_year_id, tenant=tenant)
            else:
                ay = AcademicYear.objects.filter(tenant=tenant, is_active=True).first()
                if not ay:
                    return Response({'success': False, 'detail': 'No active academic year found. Please select one.'}, status=400)
        except (Branch.DoesNotExist, AcademicYear.DoesNotExist):
            return Response({'success': False, 'detail': 'Invalid branch or academic year.'}, status=400)

        raw_bytes = file_obj.read()
        try:
            decoded_file = raw_bytes.decode('utf-8-sig')
        except UnicodeDecodeError:
            try:
                decoded_file = raw_bytes.decode('latin-1')
            except UnicodeDecodeError:
                return Response({'success': False, 'detail': 'File encoding not supported. Please save as UTF-8 CSV.'}, status=400)

        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)

        if not reader.fieldnames:
            return Response({'success': False, 'detail': 'CSV file is empty or has no headers.'}, status=400)

        # Normalize all headers to lowercase + stripped
        reader.fieldnames = [h.strip().lower() if h else f'col_{i}' for i, h in enumerate(reader.fieldnames)]

        errors = []          # list of {"row": label, "error": msg}
        success_count = 0
        skipped_duplicates = 0

        # ── helpers ──────────────────────────────────────────────────────────

        def parse_date(date_str):
            if not date_str:
                return None
            date_str = date_str.strip()
            for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y', '%Y/%m/%d', '%d.%m.%Y']:
                try:
                    return dt.strptime(date_str, fmt).date()
                except ValueError:
                    continue
            return None

        def get_val(row, *keys):
            """Flexible column lookup: exact, underscore→space, partial match."""
            for k in keys:
                if k in row and row[k]:
                    return row[k]
                k_space = k.replace('_', ' ')
                if k_space in row and row[k_space]:
                    return row[k_space]
                for rk in row.keys():
                    if k == rk or k_space == rk:
                        continue  # already tried
                    if k in rk and row[rk]:
                        return row[rk]
                    if k_space in rk and row[rk]:
                        return row[rk]
            return ''

        def safe_phone(val, max_len=15):
            """Strip spaces/dashes, truncate to max_len to avoid DB varchar errors."""
            if not val:
                return None
            cleaned = re.sub(r'[\s\-\(\)]', '', str(val))
            return cleaned[:max_len] if cleaned else None

        def safe_str(val, max_len=None):
            if not val:
                return None
            s = str(val).strip()
            if max_len:
                s = s[:max_len]
            return s or None

        # ── row processing (each row in its own savepoint) ────────────────────

        for row_idx, raw_row in enumerate(reader, start=2):
            row_label = f"Row {row_idx}"

            try:
                with transaction.atomic():  # savepoint per row — bad rows roll back, good rows commit
                    # ── 1. Clean row values ───────────────────────────────────
                    row = {}
                    for i, (k, v) in enumerate(raw_row.items()):
                        key = k.strip().lower() if isinstance(k, str) and k else f'col_{i}'
                        if isinstance(v, list):
                            val = ' '.join(str(x) for x in v if x).strip()
                        elif isinstance(v, str):
                            val = v.strip()
                        else:
                            val = str(v).strip() if v else ''
                        row[key] = val

                    # Skip completely empty rows
                    if not any(row.values()):
                        continue

                    # ── 2. Extract core fields ────────────────────────────────
                    first_name = get_val(row, 'first name', 'first_name', 'student name', 'name').strip() or 'Unknown'
                    last_name  = get_val(row, 'last name', 'last_name').strip()
                    middle_name = get_val(row, 'middle name', 'middle_name').strip()

                    # If first_name contains full name and last_name is empty, split
                    if not last_name and ' ' in first_name:
                        parts = first_name.rsplit(' ', 1)
                        first_name = parts[0].strip()
                        last_name  = parts[1].strip()

                    row_label = f"Row {row_idx} ({first_name} {last_name})".strip()

                    dob_raw   = get_val(row, 'date of birth', 'date_of_birth', 'dob').strip()
                    gender    = get_val(row, 'gender').strip().upper()
                    grade_str = get_val(row, 'class', 'grade', 'class name').strip()

                    # Section: take only first word to avoid varchar overflow (e.g. "A Section" → "A")
                    section_raw = get_val(row, 'section').strip()
                    section = section_raw.split()[0] if section_raw else 'A'
                    section = section[:50]  # ClassSection.section max_length=50

                    admission_number = get_val(row, 'admission number', 'admission_number', 'admission no').strip()

                    # ── 3. Validate / coerce values ───────────────────────────
                    if gender not in ('MALE', 'FEMALE', 'OTHER'):
                        gender = 'OTHER'

                    parsed_dob = parse_date(dob_raw)
                    if not parsed_dob:
                        # If dob is totally invalid/missing, use a safe default (will be visible as an error row in UI)
                        parsed_dob = date(2000, 1, 1)

                    # ── 4. Map grade string → GRADE_CHOICES key ──────────────
                    grade = None
                    if grade_str:
                        g_clean = grade_str.upper().strip()
                        g_clean = g_clean.replace('GRADE', '').replace('CLASS', '').strip()

                        roman_map = {
                            'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
                            'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10',
                            'XI': '11', 'XII': '12'
                        }
                        if g_clean in roman_map:
                            g_clean = roman_map[g_clean]

                        for k, v in GRADE_CHOICES:
                            if g_clean == k or g_clean == v.upper().replace('GRADE ', ''):
                                grade = k
                                break

                        if not grade and grade_str.upper().strip() in dict(GRADE_CHOICES):
                            grade = grade_str.upper().strip()

                        if not grade:
                            # Use raw string truncated — ClassSection.grade max_length=50
                            grade = grade_str[:50]

                    # ── 5. Resolve / create ClassSection ─────────────────────
                    cs = None
                    if grade:
                        cs, _ = ClassSection.objects.get_or_create(
                            tenant=tenant, branch=branch, academic_year=ay,
                            grade=grade,
                            section=section.upper(),
                        )

                    # ── 6. Duplicate check ────────────────────────────────────
                    existing_student = None

                    if admission_number:
                        existing_student = Student.objects.filter(
                            branch=branch, academic_year=ay,
                            admission_number=admission_number
                        ).first()

                    if not existing_student and cs:
                        existing_student = Student.objects.filter(
                            branch=branch, academic_year=ay,
                            first_name__iexact=first_name,
                            last_name__iexact=last_name,
                            date_of_birth=parsed_dob,
                            class_section=cs,
                        ).first()

                    # ── 7. Create or reuse student ────────────────────────────
                    is_new_student = False
                    if existing_student:
                        student = existing_student
                        skipped_duplicates += 1
                    else:
                        is_new_student = True
                        if not admission_number:
                            admission_number = Student.generate_admission_number(branch, ay)

                        # Guard against duplicate admission numbers (race condition or CSV dupe)
                        if Student.objects.filter(branch=branch, academic_year=ay, admission_number=admission_number).exists():
                            admission_number = Student.generate_admission_number(branch, ay)

                        # Parse phone numbers safely (strip spaces, truncate to 15)
                        father_phone = safe_phone(get_val(row, 'father mobile', 'father_phone', 'parent mobile', 'father mobile'))
                        mother_phone = safe_phone(get_val(row, 'mother mobile', 'mother_phone', 'mother mobile'))
                        guardian_phone = safe_phone(get_val(row, 'guardian mobile', 'guardian_phone', 'guardian mobile'))

                        blood_group_raw = row.get('blood group', row.get('blood_group', '')).upper().strip()
                        VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN', '']
                        blood_group = blood_group_raw if blood_group_raw in VALID_BLOOD_GROUPS else 'UNKNOWN'

                        caste_raw = row.get('caste category', row.get('caste_category', '')).upper().strip()
                        VALID_CASTES = ['GEN', 'OBC', 'SC', 'ST', 'EWS', 'OTHER', '']
                        caste_category = caste_raw if caste_raw in VALID_CASTES else None

                        student = Student.objects.create(
                            tenant=tenant,
                            branch=branch,
                            academic_year=ay,
                            class_section=cs,
                            first_name=first_name,
                            last_name=last_name or '',
                            date_of_birth=parsed_dob,
                            gender=gender,
                            admission_number=admission_number,
                            roll_number=int(row['roll_number']) if row.get('roll_number') and row['roll_number'].isdigit() else None,
                            # Personal
                            blood_group=blood_group or 'UNKNOWN',
                            religion=safe_str(row.get('religion'), 100),
                            caste_category=caste_category,
                            aadhar_number=safe_str(row.get('aadhar number', row.get('aadhar_number')), 12),
                            mother_tongue=safe_str(row.get('mother tongue', row.get('mother_tongue')), 50),
                            nationality=safe_str(row.get('nationality'), 50) or 'Indian',
                            # Father
                            father_name=safe_str(get_val(row, 'father name', 'father_name', 'parent name'), 200),
                            father_phone=father_phone,
                            father_email=safe_str(row.get('father email', row.get('father_email')), 254),
                            father_qualification=safe_str(row.get('father_qualification'), 100),
                            father_occupation=safe_str(row.get('father_occupation'), 100),
                            father_aadhaar=safe_str(row.get('father_aadhaar'), 12),
                            # Mother
                            mother_name=safe_str(get_val(row, 'mother name', 'mother_name'), 200),
                            mother_phone=mother_phone,
                            mother_email=safe_str(row.get('mother email', row.get('mother_email')), 254),
                            mother_qualification=safe_str(row.get('mother_qualification'), 100),
                            mother_occupation=safe_str(row.get('mother_occupation'), 100),
                            mother_aadhaar=safe_str(row.get('mother_aadhaar'), 12),
                            # Guardian
                            guardian_name=safe_str(get_val(row, 'guardian name', 'guardian_name'), 200),
                            guardian_phone=guardian_phone,
                            guardian_relation=safe_str(row.get('guardian_relation'), 100),
                            # Address
                            address_line1=safe_str(row.get('address', row.get('address_line1')), 255),
                            address_line2=safe_str(row.get('address_line2'), 255),
                            city=safe_str(row.get('city'), 100),
                            district=safe_str(row.get('district'), 100),
                            state=safe_str(row.get('state'), 100),
                            pincode=safe_str(row.get('pincode'), 6),
                            # Previous school
                            previous_school_name=safe_str(row.get('previous_school_name'), 200),
                            previous_class=safe_str(row.get('previous_class'), 20),
                            previous_school_ay=safe_str(row.get('previous_school_ay'), 20),
                            # Emergency
                            emergency_contact_name=safe_str(row.get('emergency_contact_name'), 200),
                            emergency_contact_phone=safe_phone(row.get('emergency_contact_phone')),
                            emergency_contact_relation=safe_str(row.get('emergency_contact_relation'), 100),
                            # Audit
                            created_by=user,
                            status='ACTIVE',
                        )

                        # Link parent portal accounts
                        father_info  = {'phone': student.father_phone,  'email': student.father_email,  'first_name': student.father_name or ''}
                        mother_info  = {'phone': student.mother_phone,  'email': student.mother_email,  'first_name': student.mother_name or ''}
                        link_parent_accounts_to_student(student, father_info, mother_info, tenant, branch)

                    # ── 8. Financial migration (optional) ─────────────────────
                    total_fee_raw   = get_val(row, 'total_fee', 'total amount (₹)', 'total fee').replace(',', '').replace('"', '').strip()
                    fee_paid_raw    = get_val(row, 'fee_paid', 'amount paid (₹)', 'fee paid').replace(',', '').replace('"', '').strip()
                    concession_raw  = get_val(row, 'concession_amount', 'concession (₹)', 'concession').replace(',', '').replace('"', '').strip()
                    past_due_raw    = get_val(row, 'past_due_amount', 'past due').replace(',', '').replace('"', '').strip()
                    past_due_year_raw = row.get('past_due_year', '').strip()
                    fee_due_date_raw  = row.get('fee_due_date', '').strip()

                    if total_fee_raw:
                        try:
                            total_fee  = Decimal(total_fee_raw)  if total_fee_raw  else Decimal('0')
                            fee_paid   = Decimal(fee_paid_raw)   if fee_paid_raw   else Decimal('0')
                            concession = Decimal(concession_raw) if concession_raw else Decimal('0')
                            past_due   = Decimal(past_due_raw)   if past_due_raw   else Decimal('0')
                        except InvalidOperation:
                            raise ValueError("Fee columns (total_fee, fee_paid, concession_amount, past_due_amount) must be valid numbers.")

                        net_amount         = total_fee - concession
                        outstanding_amount = net_amount - fee_paid

                        if outstanding_amount <= 0:
                            invoice_status     = 'PAID'
                            outstanding_amount = Decimal('0')
                        elif fee_paid > 0:
                            invoice_status = 'PARTIALLY_PAID'
                        else:
                            invoice_status = 'SENT'

                        due_date = parse_date(fee_due_date_raw) or date.today()
                        if invoice_status not in ('PAID', 'CANCELLED', 'WAIVED') and due_date < date.today():
                            invoice_status = 'OVERDUE'

                        invoice_number = DocumentSequence.get_next_sequence(branch, 'INVOICE', f"INV-{ay.start_date.year:04d}")
                        invoice = FeeInvoice.objects.create(
                            tenant=tenant, branch=branch, academic_year=ay, student=student,
                            invoice_number=invoice_number, month="ANNUAL",
                            gross_amount=total_fee, concession_amount=concession,
                            net_amount=net_amount, paid_amount=fee_paid,
                            outstanding_amount=outstanding_amount,
                            due_date=due_date, status=invoice_status,
                            generated_by='MANUAL', created_by=user,
                        )

                        if fee_paid > 0:
                            receipt_number = DocumentSequence.get_next_sequence(branch, 'RECEIPT', f"RCP-{ay.start_date.year:04d}")
                            Payment.objects.create(
                                tenant=tenant, branch=branch, invoice=invoice, student=student,
                                amount=fee_paid, payment_mode='CASH',
                                payment_date=date.today(), status='COMPLETED',
                                collected_by=user, receipt_number=receipt_number,
                            )

                        if past_due > 0:
                            legacy_ay_name = past_due_year_raw or "Legacy-Dues"
                            target_year    = ay.start_date.year - 1
                            legacy_ay, _   = AcademicYear.objects.get_or_create(
                                tenant=tenant, name=legacy_ay_name,
                                defaults={
                                    'start_date': datetime.date(target_year, 4, 1),
                                    'end_date':   datetime.date(target_year + 1, 3, 31),
                                    'is_active':  False,
                                    'status':     'CLOSED',
                                },
                            )
                            FeeCarryForward.objects.create(
                                tenant=tenant, branch=branch, student=student,
                                source_academic_year=legacy_ay, target_academic_year=ay,
                                total_fee_amount=past_due, total_paid_amount=Decimal('0'),
                                carry_forward_amount=past_due, status='PENDING',
                                created_by=user,
                            )
                    else:
                        # No fee data in CSV → auto-generate from FeeStructure (new student only)
                        if is_new_student:
                            create_student_fees(student, None, None, 'Auto-generated on CSV Import', user)

                    success_count += 1

            except Exception as row_error:
                # Row savepoint rolled back — record error and continue to next row
                errors.append(f"{row_label}: {str(row_error)}")
                continue

        # ── Final response ────────────────────────────────────────────────────
        has_errors = bool(errors)
        has_success = success_count > 0

        if has_success:
            msg = f"Successfully imported {success_count} student{'s' if success_count != 1 else ''}."
            if skipped_duplicates:
                msg += f" {skipped_duplicates} duplicate{'s' if skipped_duplicates != 1 else ''} skipped."
            if has_errors:
                msg += f" {len(errors)} row(s) had errors and were NOT imported (see details below)."

            return Response({
                'success': True,
                'partial': has_errors,
                'message': msg,
                'imported_count': success_count,
                'skipped_duplicates': skipped_duplicates,
                'errors': errors,
            })
        else:
            # Zero students imported — all rows failed or file was empty
            return Response({
                'success': False,
                'detail': f'No students were imported. {len(errors)} error(s) found — fix the issues below and re-upload.',
                'errors': errors,
            }, status=400)

    except Exception as fatal_error:
        import traceback
        return Response({
            'success': False,
            'detail': 'An unexpected server error occurred. Please contact support.',
            'errors': [str(fatal_error), traceback.format_exc()],
        }, status=500)
