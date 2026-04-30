import logging
from decimal import Decimal
from django.db.models import Sum
from datetime import date
from django.utils.crypto import get_random_string

logger = logging.getLogger(__name__)

def create_student_fees(student, offered_total, standard_total_input, reason, requested_by):
    """Shared logic for creating fees and triggering approvals"""
    from fees.models import FeeStructure, FeeStructureItem, StudentFeeItem, FeeApprovalRequest, FeeInvoice, FeeInvoiceItem
    from .models import Student

    branch = student.branch
    ay = student.academic_year
    class_section = student.class_section
    tenant = student.tenant

    # 1. Calculate REAL standard_total from FeeStructure
    standard_total = Decimal('0.00')
    structure = None
    
    if class_section:
        structure = FeeStructure.objects.filter(
            branch=student.branch, academic_year=ay, grade=class_section.grade, is_active=True
        ).first()
        
        if structure:
            standard_total = structure.items.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

    # Defensive: ensure offered is Decimal
    if offered_total is not None and Decimal(str(offered_total)) > 0:
        offered_total = Decimal(str(offered_total))
    else:
        offered_total = standard_total

    # 2. Create Locked Fee Items if a structure exists
    if structure:
        # We apply the reduction proportionally to all fee items
        # Use the actual standard_total from DB for ratio
        ratio = offered_total / standard_total if standard_total > 0 else 1
        
        # Generate Annual Academic Invoice
        seq = FeeInvoice.objects.filter(branch=branch).count() + 1
        invoice = FeeInvoice.objects.create(
            tenant=tenant,
            invoice_number=f"INV-{ay.start_date.year}-{seq:04d}",
            student=student,
            branch=branch,
            academic_year=ay,
            month="ANNUAL",
            gross_amount=standard_total,
            concession_amount=standard_total - offered_total if standard_total > offered_total else Decimal('0.00'),
            net_amount=offered_total,
            outstanding_amount=offered_total,
            due_date=date.today(),
            status='SENT',
            generated_by='AUTO',
            created_by=requested_by,
        )
        
        invoice_items = []
        for item in structure.items.all():
            final_amt = round(item.amount * ratio, 2)
            StudentFeeItem.objects.create(
                student=student,
                academic_year=ay,
                category=item.category,
                amount=final_amt
            )
            invoice_items.append(FeeInvoiceItem(
                invoice=invoice,
                category=item.category,
                original_amount=item.amount,
                concession=item.amount - final_amt,
                final_amount=final_amt
            ))
        
        FeeInvoiceItem.objects.bulk_create(invoice_items)

    # 3. Trigger Approval if reduction detected compared to DB standard_total
    if offered_total < standard_total:
        # Update student status to PENDING_APPROVAL
        Student.objects.filter(id=student.id).update(status='PENDING_APPROVAL')
        student.refresh_from_db() 
        
        FeeApprovalRequest.objects.create(
            tenant=tenant,
            branch=branch,
            student=student,
            requested_by=requested_by,
            standard_total=standard_total,
            offered_total=offered_total,
            reason=reason
        )
    return False


def link_parent_accounts_to_student(student, father_info, mother_info, tenant, branch):
    """Shared logic for creating parent users and student relations"""
    from accounts.models import User
    from .models import ParentStudentRelation
    
    parents_data = [
        {'phone': father_info.get('phone'), 'email': father_info.get('email'), 'first_name': father_info.get('name') or '', 'role_type': 'FATHER'},
        {'phone': mother_info.get('phone'), 'email': mother_info.get('email'), 'first_name': mother_info.get('name') or '', 'role_type': 'MOTHER'},
    ]

    for p in parents_data:
        if not p['phone'] and not p['email']:
            continue
        
        parent_email = p['email'] if p['email'] else f"{tenant.id}_{p['phone']}@parent.local"
        
        parent_user, created = User.objects.get_or_create(
            email=parent_email,
            defaults={
                'first_name': p['first_name'],
                'last_name': '',
                'phone': p['phone'] or '',
                'role': 'PARENT',
                'tenant': tenant,
                'branch': branch
            }
        )
        if created:
            # Default password for parent accounts. The parent will be forced
            # to change this on their first login via must_change_password flag.
            default_password = p['phone'] if p['phone'] else 'Welcome@123'
            parent_user.set_password(default_password)
            parent_user.must_change_password = True
            parent_user.save()
            logger.info(f"Parent account created for {parent_email} (tenant: {tenant.id})")
        
        ParentStudentRelation.objects.get_or_create(
            parent=parent_user,
            student=student,
            defaults={'relation_type': p['role_type'], 'is_primary': (p['role_type'] == 'FATHER')}
        )
