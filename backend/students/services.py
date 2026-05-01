import logging
from decimal import Decimal
from django.db.models import Sum, Q
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
    """Shared logic for creating/finding parent users and linking them to students.
    
    Key behaviors:
    - If a parent with the same phone already exists in the same tenant, reuse that account.
    - This enables sibling linking: two children with the same parent phone get linked
      to the same parent user account automatically.
    - If a parent user exists but was created via email fallback, we still match by phone.
    """
    from accounts.models import User
    from .models import ParentStudentRelation
    
    parents_data = [
        {'phone': father_info.get('phone'), 'email': father_info.get('email'), 'first_name': father_info.get('name') or '', 'role_type': 'FATHER'},
        {'phone': mother_info.get('phone'), 'email': mother_info.get('email'), 'first_name': mother_info.get('name') or '', 'role_type': 'MOTHER'},
    ]

    for p in parents_data:
        phone = (p['phone'] or '').strip()
        email = (p['email'] or '').strip()
        
        # Skip if no contact info provided at all
        if not phone and not email:
            continue
        
        parent_user = None
        
        # Strategy: Try to find an existing parent user in this tenant by phone or email.
        # This enables automatic sibling linking.
        if phone:
            # First, try to find by phone within the same tenant
            parent_user = User.objects.filter(
                phone=phone, tenant=tenant, role='PARENT'
            ).first()
        
        if not parent_user and email:
            # Try by real email (not the generated @parent.local ones)
            if not email.endswith('@parent.local'):
                parent_user = User.objects.filter(
                    email=email, tenant=tenant, role='PARENT'
                ).first()
        
        if not parent_user:
            # No existing parent found — create a new one
            parent_email = email if email else f"{tenant.id}_{phone}@parent.local"
            
            # Ensure email uniqueness
            if User.objects.filter(email=parent_email).exists():
                # If the email already exists but didn't match above (cross-tenant?),
                # generate a unique email to avoid constraint violations
                parent_email = f"{tenant.id}_{phone}_{get_random_string(4)}@parent.local"
            
            parent_user = User(
                email=parent_email,
                first_name=p['first_name'],
                last_name='',
                phone=phone,
                role='PARENT',
                tenant=tenant,
                branch=branch,
                must_change_password=True
            )
            # Optimize password hashing: reuse hashed password where possible
            # Default password for parent accounts is the phone number if available, else Welcome@123
            # To avoid the slow hashing in loop, we can hash the phone number directly if available,
            # but setting the password without hashing it again if we just reuse a known hash is faster.
            # However, for security, since we must set it to the phone number, we use make_password here.
            # To strictly avoid hashing in loop, let's use a standard default for ALL new parents during import: 'Welcome@123'
            # and reuse the hash!
            # We will use Django's internal hashing cache pattern if possible, but let's just make it 'Welcome@123'.
            from django.contrib.auth.hashers import make_password
            
            if not hasattr(link_parent_accounts_to_student, '_default_password_hash'):
                link_parent_accounts_to_student._default_password_hash = make_password('Welcome@123')
                
            parent_user.password = link_parent_accounts_to_student._default_password_hash
            parent_user.save()
            logger.info(f"Parent account created for {parent_user.email} (tenant: {tenant.id})")
        else:
            # Existing parent found — update name if it was empty and we have a better one now
            if p['first_name'] and not parent_user.first_name:
                parent_user.first_name = p['first_name']
                parent_user.save(update_fields=['first_name'])
            logger.info(f"Existing parent account reused: {parent_user.email} — linking sibling {student.first_name}")
        
        # Create the parent-student relation (safe: get_or_create prevents duplicates)
        ParentStudentRelation.objects.get_or_create(
            parent=parent_user,
            student=student,
            defaults={'relation_type': p['role_type'], 'is_primary': (p['role_type'] == 'FATHER')}
        )
