import os
import django

# Setup django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from fees.models import FeeInvoice, FeeInvoiceItem, DocumentSequence
from django.db import transaction

def run():
    with transaction.atomic():
        bundled_invoices = FeeInvoice.objects.filter(items__category__code='TRANSPORT').distinct()
        count = 0
        for inv in bundled_invoices:
            if inv.invoice_number.startswith('TRN-'):
                continue
            
            # Find the transport item
            transport_item = inv.items.filter(category__code='TRANSPORT').first()
            if not transport_item:
                continue
                
            transport_amount = transport_item.final_amount
            
            # Create new TRN invoice
            trn_number = DocumentSequence.get_next_sequence(
                branch=inv.branch, 
                document_type='INVOICE', 
                prefix=f"TRN-{inv.branch.branch_code}-{inv.month}"
            )
            
            trn_invoice = FeeInvoice.objects.create(
                tenant=inv.tenant,
                branch=inv.branch,
                academic_year=inv.academic_year,
                student=inv.student,
                month=inv.month,
                invoice_number=trn_number,
                due_date=inv.due_date,
                gross_amount=transport_amount,
                concession_amount=transport_item.concession,
                net_amount=transport_amount,
                outstanding_amount=transport_amount,
                status=inv.status, # Keep same status
                generated_by=inv.generated_by
            )
            
            # Move the item
            transport_item.invoice = trn_invoice
            transport_item.save()
            
            # Update original invoice
            inv.gross_amount -= transport_amount
            inv.net_amount -= transport_amount
            
            # Handle payments logic roughly (if already paid, etc)
            if inv.status == 'PAID':
                trn_invoice.paid_amount = transport_amount
                trn_invoice.outstanding_amount = 0
                trn_invoice.save()
                
                inv.outstanding_amount = 0
                inv.paid_amount -= transport_amount
            elif inv.status == 'PARTIALLY_PAID':
                # Just keeping logic simple, if they partially paid, they'll have to pay remainder.
                pass
            else:
                inv.outstanding_amount -= transport_amount
                
            inv.save()
            print(f"Split {inv.invoice_number} -> {trn_number}")
            count += 1
        print(f"Successfully split {count} invoices.")

if __name__ == '__main__':
    run()
