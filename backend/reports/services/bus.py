from fees.models import FeeInvoice, FeeCategory
from transport.models import StudentTransport
from reports.services.base import BaseReportService

class BusService:
    @staticmethod
    def get_bus_fee_balances(filters):
        # We need to find invoices that have transport items
        qs = FeeInvoice.objects.select_related('student', 'student__class_section').filter(
            outstanding_amount__gt=0,
            items__category__code__startswith='TRANS_'
        ).exclude(status='CANCELLED').distinct()
        
        qs = BaseReportService.apply_branch_scope(qs, filters)
        qs = BaseReportService.apply_academic_year(qs, filters.academic_year_id)
        
        return qs.order_by('-due_date')
