import os
import uuid
import django
import random
from datetime import timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from students.models import Student
from tenants.models import Tenant
from fees.models import FeeInvoice, FeeInvoiceItem, StudentFeeItem, Payment, DocumentSequence
from attendance.models import AttendanceRecord
from expenses.models import TransactionLog
from django.db import transaction

def generate():
    tenant = Tenant.objects.filter(name__icontains='test school').first()
    if not tenant:
        print("Test school tenant not found.")
        return

    today = timezone.now().date()
    start_date = today - timedelta(days=30)
    
    # Take a subset of 300 students to speed things up
    students = list(Student.objects.filter(tenant=tenant).select_related('class_section', 'branch', 'academic_year'))[:300]
    
    print("1. Generating mock attendance...")
    with transaction.atomic():
        att_objects = []
        for student in students:
            # Generate attendance for the last 30 days
            for day_offset in range(30):
                current_date = start_date + timedelta(days=day_offset)
                if current_date.weekday() >= 5:  # Skip weekends
                    continue
                    
                status = random.choices(
                    ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'],
                    weights=[85, 5, 5, 5],
                    k=1
                )[0]
                
                att_objects.append(AttendanceRecord(
                    tenant=tenant,
                    student=student,
                    class_section=student.class_section,
                    date=current_date,
                    status=status
                ))
        
        AttendanceRecord.objects.bulk_create(att_objects, ignore_conflicts=True)
    print(f"   ✓ Generated {len(att_objects)} attendance records.")

    print("2. Generating mock invoices and payments...")
    invoices_created = 0
    with transaction.atomic():
        # Get committed tuition fees for these students
        fee_items = StudentFeeItem.objects.filter(
            student__in=students, 
            category__code__in=['TUITION', 'TRANSPORT']
        ).select_related('student', 'student__branch', 'academic_year', 'category')
        
        for fee_item in fee_items:
            student = fee_item.student
            branch = student.branch
            
            # monthly approximation
            amount = round(fee_item.amount / 12, 2)
            
            # Make ~70% of invoices PAID
            is_paid = random.random() > 0.3
            
            # Mock past dates
            issue_date = timezone.now() - timedelta(days=random.randint(5, 25))
            due_date = issue_date.date() + timedelta(days=10)
            
            inv_prefix = f"INV-26-{branch.branch_code}"
            inv_number = DocumentSequence.get_next_sequence(branch, 'INVOICE', inv_prefix)
            
            inv = FeeInvoice.objects.create(
                tenant=tenant,
                branch=branch,
                student=student,
                academic_year=student.academic_year,
                invoice_number=inv_number,
                month=issue_date.strftime('%Y-%m'),
                gross_amount=amount,
                net_amount=amount,
                paid_amount=amount if is_paid else 0,
                outstanding_amount=0 if is_paid else amount,
                status='PAID' if is_paid else 'SENT',
                due_date=due_date,
                generated_by='AUTO'
            )
            # Override created_at for dashboard timeline accuracy
            FeeInvoice.objects.filter(id=inv.id).update(created_at=issue_date)
            
            FeeInvoiceItem.objects.create(
                invoice=inv,
                category=fee_item.category,
                original_amount=amount,
                final_amount=amount,
                description=f"Monthly {fee_item.category.name}"
            )
            invoices_created += 1
            
            if is_paid:
                rcpt_prefix = f"RCP-26-{branch.branch_code}"
                rcpt_number = DocumentSequence.get_next_sequence(branch, 'RECEIPT', rcpt_prefix)
                payment_date = issue_date + timedelta(days=random.randint(1, 9))
                
                payment = Payment.objects.create(
                    tenant=tenant,
                    branch=branch,
                    student=student,
                    invoice=inv,
                    amount=amount,
                    payment_mode=random.choice(['ONLINE', 'UPI', 'CASH']),
                    payment_date=payment_date,
                    status='COMPLETED',
                    receipt_number=rcpt_number
                )
                
                # Transaction Log for Income Dashboard Chart
                TransactionLog.objects.create(
                    tenant=tenant,
                    branch=branch,
                    transaction_type='INCOME',
                    category='FEE_COLLECTION',
                    amount=amount,
                    transaction_date=payment_date,
                    reference_id=payment.id,
                    description=f"Fee collection: {inv_number}"
                )
    print(f"   ✓ Generated {invoices_created} invoices with associated payments/transactions.")

    print("3. Generating random expenses...")
    with transaction.atomic():
        expense_count = 0
        branches = set(s.branch for s in students)
        for branch in branches:
            for day_offset in range(30):
                current_date = start_date + timedelta(days=day_offset)
                # 30% chance of random expense per day per branch
                if random.random() > 0.7:
                    TransactionLog.objects.create(
                        tenant=tenant,
                        branch=branch,
                        transaction_type='EXPENSE',
                        category=random.choice(['MAINTENANCE', 'SALARY', 'UTILITIES', 'SUPPLIES', 'OTHER']),
                        amount=Decimal(random.randint(1000, 15000)),
                        transaction_date=current_date,
                        reference_id=uuid.uuid4(),
                        description="Mock operational expense"
                    )
                    expense_count += 1
    print(f"   ✓ Generated {expense_count} expense transactions.")
    
    print("Dashboard seeding complete!")

if __name__ == '__main__':
    generate()
