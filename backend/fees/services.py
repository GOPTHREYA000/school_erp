from decimal import Decimal
from datetime import date
from django.db import transaction
from .models import FeeInvoice, FeeInvoiceItem, FeeStructure, FeeStructureItem, Payment
from students.models import Student
import logging

logger = logging.getLogger(__name__)


def generate_monthly_invoices(tenant, branch, academic_year_id, month, target='BRANCH', class_section_id=None, student_id=None, user=None):
    """
    Service to generate invoices for a specific target.
    Logic extracted from FeeInvoiceViewSet for reuse and testability.
    """
    # Get target students
    if target == 'STUDENT':
        students = Student.objects.filter(id=student_id, status='ACTIVE')
    elif target == 'CLASS':
        students = Student.objects.filter(class_section_id=class_section_id, status='ACTIVE')
    else:  # BRANCH
        students = Student.objects.filter(
            branch=branch, academic_year_id=academic_year_id, status='ACTIVE'
        )

    generated = 0
    skipped = 0
    errors = []

    with transaction.atomic():
        for student in students:
            # Skip if invoice already exists for this student/month
            if FeeInvoice.objects.filter(student=student, month=month).exists():
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

            # Generate invoice number (Note: Should ideally use a sequence/safe generator)
            seq = FeeInvoice.objects.filter(branch=student.branch, month=month).count() + 1
            invoice_number = f"INV-{month}-{seq:04d}"

            gross = Decimal('0.00')
            invoice_items = []
            
            # Use structure items to build the invoice
            for item in structure.items.filter(is_optional=False):
                if item.frequency == 'MONTHLY' or item.frequency == 'ONE_TIME':
                    gross += item.amount
                    invoice_items.append(FeeInvoiceItem(
                        category=item.category,
                        original_amount=item.amount,
                        concession=Decimal('0.00'),
                        final_amount=item.amount,
                    ))

            # Determine due date (Default: 10th of the month)
            year, m = month.split('-')
            due_date = date(int(year), int(m), min(10, 28))

            invoice = FeeInvoice.objects.create(
                tenant=tenant,
                invoice_number=invoice_number,
                student=student,
                branch=student.branch,
                academic_year_id=academic_year_id,
                month=month,
                gross_amount=gross,
                concession_amount=Decimal('0.00'),
                net_amount=gross,
                outstanding_amount=gross,
                due_date=due_date,
                status='SENT',
                generated_by='AUTO',
                created_by=user,
            )
            
            for inv_item in invoice_items:
                inv_item.invoice = invoice
            
            FeeInvoiceItem.objects.bulk_create(invoice_items)
            generated += 1

    return {
        'generated': generated, 
        'skipped_already_exists': skipped, 
        'errors': errors
    }

def process_initial_payment(user, student, admission_fee, tuition_payment, payment_mode, payment_date, reference_number=None):
    """
    Handles the first payment made by a student during enrollment.
    Links to the first outstanding invoice and creates a payment record.
    
    Fixed: Uses correct field names (collected_by, not created_by; invoice FK, not M2M).
    """
    total_paid = admission_fee + tuition_payment
    if total_paid <= 0:
        return {'status': 'skipped', 'message': 'No payment amount provided.'}

    with transaction.atomic():
        # Find outstanding invoice to attach payment to — lock the row
        invoice = FeeInvoice.objects.filter(
            student=student, outstanding_amount__gt=0
        ).select_for_update().first()

        if not invoice:
            logger.warning(f"No outstanding invoice found for student {student.id} during initial payment.")
            return {'status': 'skipped', 'message': 'No outstanding invoice found.'}

        # Cap payment at outstanding amount
        amount_to_apply = min(total_paid, invoice.outstanding_amount)

        # Generate receipt number
        from django.utils import timezone as tz
        seq = Payment.objects.filter(branch=student.branch).count() + 1
        receipt_number = f"RCP-{payment_date.strftime('%Y%m')}-{seq:04d}"

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

        # Create TransactionLog entry for INCOME
        try:
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
        except Exception as e:
            logger.error(f"Failed to create TransactionLog for initial payment: {e}")

        return {
            'status': 'success',
            'payment_id': str(payment.id),
            'total_paid': float(amount_to_apply)
        }
