from django.utils import timezone
from fees.models import FeeInvoice
from reports.services.base import BaseReportService
from django.db.models import F, ExpressionWrapper, DurationField

class PastDuesService:
    @staticmethod
    def get_past_dues(filters):
        today = timezone.now().date()
        qs = FeeInvoice.objects.select_related('student', 'student__class_section').filter(
            outstanding_amount__gt=0,
            due_date__lt=today
        ).exclude(status='CANCELLED')
        
        qs = BaseReportService.apply_branch_scope(qs, filters)
        qs = BaseReportService.apply_academic_year(qs, filters.academic_year_id)
        
        qs = qs.annotate(
            days_overdue=ExpressionWrapper(today - F('due_date'), output_field=DurationField())
        )
        
        return qs.order_by('due_date')
