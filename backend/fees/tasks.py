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
                
                for item in fee_structure.items.all():
                    FeeInvoiceItem.objects.create(
                        invoice=invoice,
                        category=item.category,
                        original_amount=item.amount,
                        final_amount=item.amount
                    )
                
                generated_count += 1
                
        logger.info(f"Successfully generated {generated_count} invoices for {class_section}.")
        return {"status": "success", "generated": generated_count}
        
    except Exception as e:
        logger.error(f"Bulk fee allocation failed: {str(e)}")
        raise
