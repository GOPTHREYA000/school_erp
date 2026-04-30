import os
from django.core.management.base import BaseCommand
from fees.models import FeeInvoice, FeeInvoiceItem

class Command(BaseCommand):
    help = "Cleanup existing bundled invoices to prepare for split invoices"

    def handle(self, *args, **kwargs):
        # Delete all FeeInvoices
        count = FeeInvoice.objects.all().delete()
        print(f"Deleted {count[0]} invoices")

