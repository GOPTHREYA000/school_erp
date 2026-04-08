from django.core.management.base import BaseCommand
from django.db.models import Sum
from fees.models import FeeInvoice, Payment
from expenses.models import TransactionLog
from decimal import Decimal

class Command(BaseCommand):
    help = 'Validates financial data integrity across Invoices, Payments, and Ledger'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting financial integrity check...'))
        
        # 1. Check Invoice vs Payments
        drifts = []
        invoices = FeeInvoice.objects.exclude(status='CANCELLED')
        
        for inv in invoices:
            payment_sum = Payment.objects.filter(
                invoice=inv, status='COMPLETED'
            ).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
            
            if inv.paid_amount != payment_sum:
                drifts.append({
                    'type': 'INVOICE_PAYMENT_DRIFT',
                    'id': inv.invoice_number,
                    'invoice_paid': inv.paid_amount,
                    'payment_sum': payment_sum,
                    'delta': inv.paid_amount - payment_sum
                })

        # 2. Check Payments vs Ledger (TransactionLog)
        ledger_gaps = []
        payments = Payment.objects.filter(status='COMPLETED')
        
        for pay in payments:
            ledger_entry = TransactionLog.objects.filter(
                reference_model='Payment',
                reference_id=pay.id,
                transaction_type='INCOME'
            ).exists()
            
            if not ledger_entry:
                ledger_gaps.append({
                    'type': 'MISSING_LEDGER_ENTRY',
                    'id': pay.receipt_number,
                    'amount': pay.amount
                })

        # Summary
        self.stdout.write(f"Checked {invoices.count()} invoices and {payments.count()} payments.")
        
        if drifts:
            self.stdout.write(self.style.ERROR(f"Found {len(drifts)} invoice/payment drifts!"))
            for d in drifts[:10]:
                self.stdout.write(f"  - {d['id']}: Invoice={d['invoice_paid']}, Payments={d['payment_sum']} (Δ {d['delta']})")
        else:
            self.stdout.write(self.style.SUCCESS("No invoice/payment drifts found."))

        if ledger_gaps:
            self.stdout.write(self.style.ERROR(f"Found {len(ledger_gaps)} payments missing ledger entries!"))
            for g in ledger_gaps[:10]:
                self.stdout.write(f"  - Receipt {g['id']}: Amount {g['amount']}")
        else:
            self.stdout.write(self.style.SUCCESS("All payments have corresponding ledger entries."))

        if not drifts and not ledger_gaps:
            self.stdout.write(self.style.SUCCESS("FINANCIAL INTEGRITY VERIFIED."))
        else:
            self.stdout.write(self.style.WARNING("INTEGRITY ISSUES DETECTED. PLEASE INVESTIGATE."))
