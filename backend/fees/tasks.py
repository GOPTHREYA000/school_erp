import logging
from django.db import transaction
from django.utils import timezone
from celery import shared_task

logger = logging.getLogger(__name__)

@shared_task
def bulk_allocate_fees(branch_id, academic_year_id, class_section_id, fee_structure_id, month=None):
    """
    Background worker to allocate fees to an entire class section at once.
    This prevents timeout errors on the frontend for large classes.
    """
    from fees.models import FeeStructure, FeeInvoice, FeeInvoiceItem, DocumentSequence
    from tenants.models import Branch, AcademicYear
    from students.models import ClassSection, Student
    
    try:
        branch = Branch.objects.get(id=branch_id)
        academic_year = AcademicYear.objects.get(id=academic_year_id)
        class_section = ClassSection.objects.get(id=class_section_id)
        fee_structure = FeeStructure.objects.prefetch_related('items__category').get(id=fee_structure_id)
        
        students = Student.objects.filter(
            class_section=class_section, 
            status='ACTIVE'
        )
        
        generated_count = 0
        
        for student in students:
            # Prevent double generation
            existing_invoice = FeeInvoice.objects.filter(
                student=student, 
                academic_year=academic_year, 
                month=month
            ).exists()
            
            if existing_invoice:
                continue
                
            with transaction.atomic():
                invoice_number = DocumentSequence.get_next_sequence(branch, 'INVOICE', f"INV-{branch.branch_code}-{month}")
                
                gross = sum(item.amount for item in fee_structure.items.all())
                invoice_items_data = list(fee_structure.items.all())

                # ── Dynamic Transport Fee Injection ──
                from transport.models import StudentTransport
                from fees.models import FeeCategory
                active_transport = StudentTransport.objects.filter(
                    student=student, is_active=True
                ).select_related('route').first()

                transport_cat = None
                transport_amount = None
                if active_transport:
                    transport_cat, _ = FeeCategory.objects.get_or_create(
                        branch=branch,
                        code='TRANSPORT',
                        defaults={
                            'tenant': branch.tenant,
                            'name': 'Transport Fee',
                            'description': 'Monthly school transport fee',
                            'is_active': True,
                            'order': 99,
                        }
                    )
                    transport_amount = active_transport.monthly_fee
                    gross += transport_amount
                
                invoice = FeeInvoice.objects.create(
                    tenant=branch.tenant,
                    branch=branch,
                    student=student,
                    academic_year=academic_year,
                    month=month,
                    invoice_number=invoice_number,
                    gross_amount=gross,
                    net_amount=gross, 
                    outstanding_amount=gross,
                    due_date=timezone.now().date(), 
                    status='DRAFT' 
                )
                
                for item in invoice_items_data:
                    FeeInvoiceItem.objects.create(
                        invoice=invoice,
                        category=item.category,
                        original_amount=item.amount,
                        final_amount=item.amount
                    )

                # Add transport line item if applicable
                if active_transport and transport_cat and transport_amount:
                    FeeInvoiceItem.objects.create(
                        invoice=invoice,
                        category=transport_cat,
                        original_amount=transport_amount,
                        final_amount=transport_amount,
                        description=f"Transport: {active_transport.route.name} ({active_transport.distance_km} km)",
                    )
                
                generated_count += 1
                
        logger.info(f"Successfully generated {generated_count} invoices for {class_section}.")
        return {"status": "success", "generated": generated_count}
        
    except Exception as e:
        logger.error(f"Bulk fee allocation failed: {str(e)}")
        raise
