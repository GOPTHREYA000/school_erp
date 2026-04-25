from django.db.models import Count, Sum
from students.models import AdmissionApplication, AdmissionInquiry
from reports.services.base import BaseReportService
from django.db.models.functions import TruncMonth

class AdmitService:
    @staticmethod
    def get_applicants(filters):
        qs = AdmissionApplication.objects.select_related(
            'academic_year', 'branch', 'inquiry'
        )
        qs = BaseReportService.apply_branch_scope(qs, filters)
        qs = BaseReportService.apply_date_range(qs, 'created_at__date', filters.start_date, filters.end_date)
        qs = BaseReportService.apply_academic_year(qs, filters.academic_year_id)
        
        if filters.status:
            qs = qs.filter(status=filters.status)
        if filters.class_id:
            qs = qs.filter(grade_applying_for=filters.class_id)
        if hasattr(filters, 'source') and filters.source:
            qs = qs.filter(source=filters.source)
            
        return qs.order_by('-created_at')

    @staticmethod
    def get_applicant_counts_by_class(filters):
        qs = AdmissionApplication.objects.all()
        qs = BaseReportService.apply_branch_scope(qs, filters)
        qs = BaseReportService.apply_academic_year(qs, filters.academic_year_id)
        
        return qs.values('grade_applying_for').annotate(count=Count('id')).order_by('grade_applying_for')

    @staticmethod
    def get_applicant_counts_by_month(filters):
        qs = AdmissionApplication.objects.all()
        qs = BaseReportService.apply_branch_scope(qs, filters)
        qs = BaseReportService.apply_academic_year(qs, filters.academic_year_id)
        
        # We need TruncMonth
        return qs.annotate(month=TruncMonth('created_at')).values('month').annotate(
            count=Count('id')
        ).order_by('month')
