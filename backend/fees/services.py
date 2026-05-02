from decimal import Decimal
from datetime import date
from django.db import transaction
from .models import FeeInvoice, FeeInvoiceItem, FeeStructure, FeeStructureItem, Payment
from students.models import Student
from accounts.utils import log_audit_action, log_bulk_action
import logging

logger = logging.getLogger(__name__)


def generate_monthly_invoices(tenant, branch, academic_year_id, month, target='BRANCH', class_section_id=None, student_id=None, user=None):
    """
    Service to generate invoices for a specific target.
    Logic extracted from FeeInvoiceViewSet for reuse and testability.
    """
    # Get target students (always tenant-scoped for STUDENT/CLASS targets)
    if target == 'STUDENT':
        students = Student.objects.filter(id=student_id, status='ACTIVE', tenant=tenant)
    elif target == 'CLASS':
        students = Student.objects.filter(
            class_section_id=class_section_id,
            status='ACTIVE',
            tenant=tenant,
        )
    else:  # BRANCH
        students = Student.objects.filter(
            branch=branch, academic_year_id=academic_year_id, status='ACTIVE'
        )

    generated = 0
    skipped = 0
    errors = []

    from tenants.models import AcademicYear
    ay = AcademicYear.objects.get(id=academic_year_id)
    target_year, target_month = map(int, month.split('-'))
    month_index = (target_year - ay.start_date.year) * 12 + target_month - ay.start_date.month

    with transaction.atomic():
        for student in students:
            # Skip if academic invoice already exists for this student/month
            has_academic = FeeInvoice.objects.filter(student=student, month=month).exclude(invoice_number__startswith='TRN-').exists()
            has_transport = FeeInvoice.objects.filter(student=student, month=month, invoice_number__startswith='TRN-').exists()

            from transport.models import StudentTransport
            active_transport = StudentTransport.objects.filter(student=student, is_active=True).first()

            if has_academic and (has_transport or not active_transport):
                skipped += 1
                continue

            # Lookup fee structure for student's grade
            grade = student.class_section.grade if student.class_section else None
            if not grade:
                errors.append({'student_id': str(student.id), 'error': 'No class assigned'})
                continue

            structure = FeeStructure.objects.filter(
                branch=student.branch, academic_year_id=academic_year_id, grade=grade, is_active=True
            ).first()
            if not structure:
                errors.append({'student_id': str(student.id), 'error': 'No fee structure found'})
                continue

            from .models import DocumentSequence

            gross = Decimal('0.00')
            invoice_items = []
            
            # Use structure items to build the invoice
            for item in structure.items.filter(is_optional=False):
                include_item = False
                if item.frequency == 'MONTHLY' or item.frequency == 'ONE_TIME':
                    include_item = True
                elif item.frequency == 'QUARTERLY' and month_index % 3 == 0:
                    include_item = True
                elif item.frequency == 'HALF_YEARLY' and month_index % 6 == 0:
                    include_item = True
                elif item.frequency == 'ANNUALLY' and month_index == 0:
                    include_item = True
                    
                if include_item:
                    gross += item.amount
                    invoice_items.append(FeeInvoiceItem(
                        category=item.category,
                        original_amount=item.amount,
                        concession=Decimal('0.00'),
                        final_amount=item.amount,
                    ))

            # Apply Concessions (Simplify for now: hard-code 0)
            discount = Decimal('0.00')
            academic_net = gross - discount

            created_any = False
            if invoice_items and not has_academic:
                invoice_number = DocumentSequence.get_next_sequence(
                    branch=student.branch, 
                    document_type='INVOICE', 
                    prefix=f"INV-{student.branch.branch_code}-{month}"
                )
                invoice = FeeInvoice.objects.create(
                    tenant=student.tenant,
                    branch=student.branch,
                    academic_year_id=academic_year_id,
                    student=student,
                    month=month,
                    invoice_number=invoice_number,
                    due_date=date.today().replace(day=10),
                    gross_amount=gross,
                    concession_amount=discount,
                    net_amount=academic_net,
                    outstanding_amount=academic_net,
                    status='SENT',
                    generated_by='AUTO'
                )

                for item in invoice_items:
                    item.invoice = invoice
                FeeInvoiceItem.objects.bulk_create(invoice_items)
                created_any = True

            # Also generate transport invoice if needed
            if active_transport and not has_transport:
                _create_transport_invoice(student, academic_year_id, month, active_transport)
                created_any = True

            if created_any:
                generated += 1

        if generated > 0 and user:
            log_bulk_action(
                user=user,
                action_type='INVOICE_GENERATION',
                record_count=generated,
                details={'month': month, 'target': target},
                tenant=tenant,
            )

    return {
        'generated': generated,
        'skipped': skipped,
        'errors': errors
    }


def generate_transport_invoice_only(student_id, academic_year_id, month):
    """
    Generate ONLY a transport invoice for a specific student.
    Called from the Student Profile "Generate Invoice" button.
    Does NOT create academic invoices.
    """
    student = Student.objects.filter(id=student_id, status='ACTIVE').first()
    if not student:
        return {'error': 'Student not found or not active.'}

    from transport.models import StudentTransport
    active_transport = StudentTransport.objects.filter(student=student, is_active=True).first()
    if not active_transport:
        return {'error': 'Student is not enrolled in transport.'}

    # Check if transport invoice already exists for this month
    has_transport = FeeInvoice.objects.filter(
        student=student, month=month, invoice_number__startswith='TRN-'
    ).exists()
    if has_transport:
        return {'error': f'Transport invoice already exists for {month}.'}

    with transaction.atomic():
        _create_transport_invoice(student, academic_year_id, month, active_transport)

    return {'success': True}


def _create_transport_invoice(student, academic_year_id, month, active_transport):
    """Internal helper: creates a single transport invoice + line item."""
    from .models import FeeCategory as FC, DocumentSequence

    transport_cat, _ = FC.objects.get_or_create(
        branch=student.branch,
        code='TRANSPORT',
        defaults={
            'tenant': student.tenant,
            'name': 'Transport Fee',
            'description': 'Monthly school transport fee',
            'is_active': True,
            'order': 99,
        }
    )
    transport_amount = active_transport.monthly_fee
    transport_invoice_number = DocumentSequence.get_next_sequence(
        branch=student.branch,
        document_type='INVOICE',
        prefix=f"TRN-{student.branch.branch_code}-{month}"
    )

    transport_invoice = FeeInvoice.objects.create(
        tenant=student.tenant,
        branch=student.branch,
        academic_year_id=academic_year_id,
        student=student,
        month=month,
        invoice_number=transport_invoice_number,
        due_date=date.today().replace(day=10),
        gross_amount=transport_amount,
        concession_amount=Decimal('0.00'),
        net_amount=transport_amount,
        outstanding_amount=transport_amount,
        status='SENT',
        generated_by='AUTO'
    )

    FeeInvoiceItem.objects.create(
        invoice=transport_invoice,
        category=transport_cat,
        original_amount=transport_amount,
        concession=Decimal('0.00'),
        final_amount=transport_amount,
        description=f"Transport: {active_transport.pickup_point} ({active_transport.distance_km} km)"
    )
    return transport_invoice


def process_initial_payment(user, student, admission_fee, tuition_payment, payment_mode, payment_date, reference_number=None):
    from decimal import Decimal
    from django.db import transaction
    from .models import FeeInvoice, Payment, FeeInvoiceItem, FeeStructureItem

    total_paid = Decimal(str(admission_fee)) + Decimal(str(tuition_payment))
    if total_paid <= 0:
        return {'status': 'skipped', 'message': 'Amount is zero.'}

    with transaction.atomic():
        # Find OUTSTANDING invoice for this student (assumes generated during admission)
        invoice = FeeInvoice.objects.filter(
            student=student, outstanding_amount__gt=0
        ).select_for_update().first()

        if not invoice:
            logger.warning(f"No outstanding invoice found for student {student.id} during initial payment.")
            return {'status': 'skipped', 'message': 'No outstanding invoice found.'}

        # Cap payment at outstanding amount
        amount_to_apply = min(total_paid, invoice.outstanding_amount)

        # Generate receipt number safely
        from django.utils import timezone as tz
        from .models import DocumentSequence
        receipt_number = DocumentSequence.get_next_sequence(
            branch=student.branch,
            document_type='RECEIPT',
            prefix=f"RCP-{payment_date.strftime('%Y%m')}"
        )

        payment = Payment.objects.create(
            tenant=student.tenant,
            invoice=invoice,            # Direct FK — not M2M
            student=student,
            branch=student.branch,
            amount=amount_to_apply,
            payment_mode=payment_mode,
            payment_date=payment_date,
            reference_number=reference_number,
            status='COMPLETED',
            collected_by=user,          # Correct field name (not created_by)
            receipt_number=receipt_number,
        )

        # Update invoice amounts — safe because row is locked
        invoice.paid_amount += amount_to_apply
        invoice.outstanding_amount = max(invoice.net_amount - invoice.paid_amount, Decimal('0.00'))
        if invoice.outstanding_amount <= 0:
            invoice.status = 'PAID'
            invoice.outstanding_amount = Decimal('0.00')
        else:
            invoice.status = 'PARTIALLY_PAID'
        invoice.save()

        # Create TransactionLog entry for INCOME — NO try/except!
        # Must participate in @transaction.atomic to guarantee consistency.
        from expenses.models import TransactionLog
        TransactionLog.objects.create(
            tenant=student.tenant,
            branch=student.branch,
            transaction_type='INCOME',
            category='Fee Payment',
            reference_model='Payment',
            reference_id=payment.id,
            amount=amount_to_apply,
            description=f"Initial enrollment payment for {invoice.invoice_number}",
            transaction_date=payment_date,
        )

        log_audit_action(
            user=user,
            action='CREATE_INITIAL_PAYMENT',
            model_name='Payment',
            record_id=payment.id,
            details={
                'invoice_number': invoice.invoice_number,
                'amount': float(amount_to_apply),
                'receipt_number': receipt_number
            }
        )

        return {
            'status': 'success',
            'payment_id': str(payment.id),
            'total_paid': float(amount_to_apply)
        }
