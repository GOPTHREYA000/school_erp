import csv
import io
import re
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
                if not branch_id: return Response({'success': False, 'detail': 'SUPER_ADMIN must provide a branch_id.'}, status=400)
                branch = Branch.objects.get(id=branch_id)
                tenant = branch.tenant
            else:
                # If no branch_id passed, use the accountant/teacher's own branch
                branch = Branch.objects.get(id=branch_id, tenant=user.tenant) if branch_id else user.branch
                if not branch: return Response({'success': False, 'detail': 'No branch associated with your account.'}, status=400)
                tenant = user.tenant

            if academic_year_id:
                ay = AcademicYear.objects.get(id=academic_year_id, tenant=tenant)
            else:
                # Fallback to current academic year
                ay = AcademicYear.objects.filter(tenant=tenant, is_active=True).first()
                if not ay:
                    return Response({'success': False, 'detail': 'No current academic year found. Please select one.'}, status=400)
        except (Branch.DoesNotExist, AcademicYear.DoesNotExist):
            return Response({'success': False, 'detail': 'Invalid branch or academic year.'}, status=400)

        raw_bytes = file_obj.read()
        try:
            decoded_file = raw_bytes.decode('utf-8-sig')
        except UnicodeDecodeError:
            try:
                decoded_file = raw_bytes.decode('latin-1')
            except UnicodeDecodeError:
                return Response({'success': False, 'detail': 'File encoding is not supported. Please save as UTF-8 CSV.'}, status=400)

        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)
        
        if not reader.fieldnames:
            return Response({'success': False, 'detail': 'CSV file is empty or has no headers.'}, status=400)
        
        reader.fieldnames = [h.strip().lower() if h else f'col_{i}' for i, h in enumerate(reader.fieldnames)]
        
        errors = []
        success_count = 0
        skipped_duplicates = 0
        grade_map = {choice[1].lower(): choice[0] for choice in GRADE_CHOICES}

        def parse_date(date_str):
            if not date_str: return None
            date_str = date_str.strip()
            formats = ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y', '%Y/%m/%d', '%d.%m.%Y']
            for fmt in formats:
                try: return dt.strptime(date_str, fmt).date()
                except ValueError: continue
            return None

        def get_val(row, *keys):
            for k in keys:
                if k in row and row[k]: return row[k]
                # Also try to match with spaces instead of underscores
                k_space = k.replace('_', ' ')
                if k_space in row and row[k_space]: return row[k_space]
                
                # Check for partial matches in the actual headers
                for rk in row.keys():
                    if k in rk and row[rk]: return row[rk]
                    if k_space in rk and row[rk]: return row[rk]
            return ''

        try:
            with transaction.atomic():
                for row_idx, row in enumerate(reader, start=2):
                    row_label = f"Row {row_idx}"
                    try:
                        with transaction.atomic():
                            clean_row = {}
                            for i, (k, v) in enumerate(row.items()):
                                key = k.strip().lower() if isinstance(k, str) and k else f'col_{i}'
                                if isinstance(v, list):
                                    val = ' '.join(str(x) for x in v if x).strip()
                                elif isinstance(v, str):
                                    val = v.strip()
                                else:
                                    val = str(v) if v else ''
                                clean_row[key] = val
                            row = clean_row
                            
                            if not any(row.values()): continue

                            first_name = get_val(row, 'first_name', 'student name', 'name', 'student_name').strip() or 'Unknown'
                            last_name = get_val(row, 'last_name').strip()
                            
                            if not last_name and ' ' in first_name:
                                parts = first_name.rsplit(' ', 1)
                                first_name = parts[0]
                                last_name = parts[1]
                                
                            dob_raw = get_val(row, 'date_of_birth', 'dob').strip()
                            gender = get_val(row, 'gender').strip().upper()
                            grade_str = get_val(row, 'grade', 'class').strip()
                            
                            # Safely parse and truncate section to max 5 chars to prevent varchar(5) DB errors
                            section_raw = get_val(row, 'section').strip()
                            section = section_raw.split()[0] if ' ' in section_raw else section_raw
                            section = section[:5]
                            
                            admission_number = get_val(row, 'admission_number', 'admission no').strip()

                        row_label = f"Row {row_idx} ({first_name} {last_name})"

                        if gender not in ('MALE', 'FEMALE', 'OTHER'):
                            gender = 'OTHER'

                        parsed_dob = parse_date(dob_raw) or dt.now().date()

                        grade = None
                        if grade_str:
                            g_clean = grade_str.upper().strip()
                            g_clean = g_clean.replace('GRADE', '').replace('CLASS', '').strip()
                            
                            roman_map = {'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5', 'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10', 'XI': '11', 'XII': '12'}
                            if g_clean in roman_map:
                                g_clean = roman_map[g_clean]
                                
                            for k, v in GRADE_CHOICES:
                                if g_clean == k or g_clean == v.upper().replace('GRADE ', ''):
                                    grade = k
                                    break
                            
                            if not grade and grade_str.upper().strip() in dict(GRADE_CHOICES):
                                grade = grade_str.upper().strip()
                                
                            if not grade:
                                grade = grade_str[:50]

                        cs = None
                        if grade and section:
                            with transaction.atomic():
                                cs, _ = ClassSection.objects.get_or_create(
                                    tenant=tenant, branch=branch, academic_year=ay,
                                    grade=grade, section=section.upper(),
                                )

                            # Duplicate check
                            existing_student = None
                            if admission_number:
                                existing_student = Student.objects.filter(
                                    branch=branch, academic_year=ay,
                                    admission_number=admission_number
                                ).first()
                                
                            if not existing_student and cs:
                                existing_student = Student.objects.filter(
                                    branch=branch, academic_year=ay,
                                    first_name__iexact=first_name, last_name__iexact=last_name,
                                    date_of_birth=parsed_dob, class_section=cs,
                                ).first()
                                
                            is_new_student = False
                            if existing_student:
                                student = existing_student
                                skipped_duplicates += 1
                            else:
                                is_new_student = True
                                if not admission_number:
                                    admission_number = Student.generate_admission_number(branch, ay)

                        if is_new_student:
                            if Student.objects.filter(branch=branch, academic_year=ay, admission_number=admission_number).exists():
                                # If auto-generated clashes (rare) or provided clashes
                                admission_number = Student.generate_admission_number(branch, ay)

                            # Map all optional fields from CSV
                            student = Student.objects.create(
                                tenant=tenant,
                                branch=branch,
                                academic_year=ay,
                                class_section=cs,
                                first_name=first_name,
                                last_name=last_name,
                                date_of_birth=parsed_dob,
                                gender=gender,
                                admission_number=admission_number,
                                roll_number=int(row['roll_number']) if row.get('roll_number') else None,
                                # Personal
                                blood_group=row.get('blood_group', '').upper() or 'UNKNOWN',
                                religion=row.get('religion') or None,
                                caste_category=row.get('caste_category', '').upper() or None,
                                aadhar_number=row.get('aadhar_number') or None,
                                mother_tongue=row.get('mother_tongue') or None,
                                nationality=row.get('nationality') or 'Indian',
                                # Father Info
                                father_name=get_val(row, 'father_name', 'parent name', 'father name') or None,
                                father_phone=get_val(row, 'father_phone', 'parent mobile', 'father mobile') or None,
                                father_email=row.get('father_email') or None,
                                father_qualification=row.get('father_qualification') or None,
                                father_occupation=row.get('father_occupation') or None,
                                father_aadhaar=row.get('father_aadhaar') or None,
                                # Mother Info
                                mother_name=get_val(row, 'mother_name', 'mother name') or None,
                                mother_phone=get_val(row, 'mother_phone', 'mother mobile') or None,
                                mother_email=row.get('mother_email') or None,
                                mother_qualification=row.get('mother_qualification') or None,
                                mother_occupation=row.get('mother_occupation') or None,
                                mother_aadhaar=row.get('mother_aadhaar') or None,
                                # Guardian Info
                                guardian_name=get_val(row, 'guardian_name', 'guardian name') or None,
                                guardian_phone=get_val(row, 'guardian_phone', 'guardian mobile') or None,
                                guardian_relation=row.get('guardian_relation') or None,
                                # Address
                                address_line1=row.get('address') or row.get('address_line1') or None,
                                address_line2=row.get('address_line2') or None,
                                city=row.get('city') or None,
                                district=row.get('district') or None,
                                state=row.get('state') or None,
                                pincode=row.get('pincode') or None,
                                # Previous School
                                previous_school_name=row.get('previous_school_name') or None,
                                previous_class=row.get('previous_class') or None,
                                previous_school_ay=row.get('previous_school_ay') or None,
                                # Emergency
                                emergency_contact_name=row.get('emergency_contact_name') or None,
                                emergency_contact_phone=row.get('emergency_contact_phone') or None,
                                emergency_contact_relation=row.get('emergency_contact_relation') or None,
                                # Audit
                                created_by=user,
                                status='ACTIVE',
                            )

                            father_info = {'phone': student.father_phone, 'email': student.father_email, 'name': student.father_name}
                            mother_info = {'phone': student.mother_phone, 'email': student.mother_email, 'name': student.mother_name}
                            link_parent_accounts_to_student(student, father_info, mother_info, tenant, branch)
                        
                        # --- FINANCIAL MIGRATION LOGIC ---
                        total_fee_raw = get_val(row, 'total_fee', 'total amount (₹)').replace(',', '').replace('"', '').strip()
                        fee_paid_raw = get_val(row, 'fee_paid', 'amount paid (₹)').replace(',', '').replace('"', '').strip()
                        concession_raw = get_val(row, 'concession_amount', 'concession (₹)').replace(',', '').replace('"', '').strip()
                        past_due_raw = get_val(row, 'past_due_amount', 'past due').replace(',', '').replace('"', '').strip()
                        past_due_year_raw = row.get('past_due_year', '').strip()
                        fee_due_date_raw = row.get('fee_due_date', '').strip()
                        
                        if total_fee_raw:
                            # We have explicit fee data from legacy system. Avoid automatic fee creation.
                            try:
                                total_fee = Decimal(total_fee_raw) if total_fee_raw else Decimal('0')
                                fee_paid = Decimal(fee_paid_raw) if fee_paid_raw else Decimal('0')
                                concession = Decimal(concession_raw) if concession_raw else Decimal('0')
                                past_due = Decimal(past_due_raw) if past_due_raw else Decimal('0')
                            except InvalidOperation:
                                raise ValueError("Total fee, fee paid, concession, and past due amount must be valid numbers.")
                            
                            net_amount = total_fee - concession
                            outstanding_amount = net_amount - fee_paid
                            
                            # Compute invoice status
                            if outstanding_amount <= 0:
                                invoice_status = 'PAID'
                                outstanding_amount = Decimal('0') # avoid negative
                            elif fee_paid > 0:
                                invoice_status = 'PARTIALLY_PAID'
                            else:
                                invoice_status = 'SENT'
                            
                            due_date = parse_date(fee_due_date_raw) or date.today()
                            if invoice_status not in ('PAID', 'CANCELLED', 'WAIVED') and due_date < date.today():
                                invoice_status = 'OVERDUE'
                            
                            invoice_number = DocumentSequence.get_next_sequence(branch, 'INVOICE', f"INV-{ay.start_date.year:04d}")
                            
                            invoice = FeeInvoice.objects.create(
                                tenant=tenant,
                                branch=branch,
                                academic_year=ay,
                                student=student,
                                invoice_number=invoice_number,
                                month="ANNUAL",
                                gross_amount=total_fee,
                                concession_amount=concession,
                                net_amount=net_amount,
                                paid_amount=fee_paid,
                                outstanding_amount=outstanding_amount,
                                due_date=due_date,
                                status=invoice_status,
                                generated_by='MANUAL',
                                created_by=user
                            )
                            
                            if fee_paid > 0:
                                receipt_number = DocumentSequence.get_next_sequence(branch, 'RECEIPT', f"RCP-{ay.start_date.year:04d}")
                                Payment.objects.create(
                                    tenant=tenant,
                                    branch=branch,
                                    invoice=invoice,
                                    student=student,
                                    amount=fee_paid,
                                    payment_mode='CASH', # Defaulting to CASH for legacy migrations
                                    payment_date=date.today(),
                                    status='COMPLETED',
                                    collected_by=user,
                                    receipt_number=receipt_number
                                )
                            
                            if past_due > 0:
                                # Handle carry forward
                                # Create or fetch a 'Legacy' academic year to map to
                                legacy_ay_name = past_due_year_raw or "Legacy-Dues"
                                # Just an easy default, assume 1 year before
                                import datetime
                                target_year = ay.start_date.year - 1
                                legacy_ay, _ = AcademicYear.objects.get_or_create(
                                    tenant=tenant,
                                    name=legacy_ay_name,
                                    defaults={
                                        'start_date': datetime.date(target_year, 4, 1),
                                        'end_date': datetime.date(target_year + 1, 3, 31),
                                        'is_active': False,
                                        'status': 'CLOSED'
                                    }
                                )
                                
                                FeeCarryForward.objects.create(
                                    tenant=tenant,
                                    branch=branch,
                                    student=student,
                                    source_academic_year=legacy_ay,
                                    target_academic_year=ay,
                                    total_fee_amount=past_due,
                                    total_paid_amount=Decimal('0'),
                                    carry_forward_amount=past_due,
                                    status='PENDING',
                                    created_by=user
                                )
                        else:
                            # Normal new student flow — auto-link to existing FeeStructures
                            if is_new_student:
                                create_student_fees(student, None, None, 'Auto-generated on CSV Import', user)
                        
                        success_count += 1
                            
                    except Exception as row_error:
                        errors.append(f"{row_label}: {str(row_error)}")

                if errors:
                    # Roll back entire outer transaction safely
                    raise ValueError("Validation failed.")
                    
        except Exception as e:
            if not errors:
                errors = [str(e)]
            return Response({
                'success': False, 
                'detail': f'Import failed. No students were imported. {len(errors)} error(s) found — please fix the CSV and retry.', 
                'errors': errors
            }, status=400)

        msg = f"Successfully imported {success_count} student{'s' if success_count != 1 else ''}."
        if skipped_duplicates:
            msg += f" {skipped_duplicates} duplicate{'s' if skipped_duplicates != 1 else ''} skipped."
        
        return Response({
            'success': True,
            'message': msg,
            'imported_count': success_count,
            'skipped_duplicates': skipped_duplicates,
        })
    except Exception as fatal_error:
        import traceback
        traceback_str = traceback.format_exc()
        return Response({
            'success': False,
            'detail': 'An unexpected fatal error occurred in the backend processing.',
            'errors': [str(fatal_error), traceback_str]
        }, status=400)
