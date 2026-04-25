from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from ..permissions import ReportAccessPermission
from ..pagination import ReportPagination
from ..filters import BaseReportFilter
from ..services.academics import AcademicsService

class AcademicsReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, ReportAccessPermission]

    @action(detail=False, methods=['get'], url_path='students-list')
    def students_list(self, request):
        filters = BaseReportFilter(request, request.user)
        qs = AcademicsService.get_students(filters)
        
        data = qs.values(
            'id', 'admission_number', 'first_name', 'last_name', 
            'class_section__grade', 'class_section__section', 
            'status', 'gender', 'caste_category'
        )
        
        paginator = ReportPagination()
        page = paginator.paginate_queryset(data, request, view=self)
        return paginator.get_paginated_response(page)

    @action(detail=False, methods=['get'], url_path='student-strength')
    def student_strength(self, request):
        filters = BaseReportFilter(request, request.user)
        data = AcademicsService.get_student_strength(filters)
        return ReportPagination().get_unpaginated_response(list(data))

    @action(detail=False, methods=['get'], url_path='student-attendance-daily')
    def student_attendance_daily(self, request):
        filters = BaseReportFilter(request, request.user)
        qs = AcademicsService.get_student_attendance_daily(filters)
        
        data = qs.values(
            'date', 'status', 'student__first_name', 'student__last_name',
            'class_section__grade', 'class_section__section'
        )
        
        paginator = ReportPagination()
        page = paginator.paginate_queryset(data, request, view=self)
        return paginator.get_paginated_response(page)

    @action(detail=False, methods=['get'], url_path='student-notes')
    def student_notes(self, request):
        return ReportPagination().get_unpaginated_response([])

    @action(detail=False, methods=['get'], url_path='hall-tickets')
    def hall_tickets(self, request):
        return ReportPagination().get_unpaginated_response([])

    @action(detail=False, methods=['get'], url_path='consolidated-marks')
    def consolidated_marks(self, request):
        return ReportPagination().get_unpaginated_response([])

    @action(detail=False, methods=['get'], url_path='section-report-cards')
    def section_report_cards(self, request):
        return ReportPagination().get_unpaginated_response([])
        
    @action(detail=False, methods=['get'], url_path='section-report-cards-summary')
    def section_report_cards_summary(self, request):
        return ReportPagination().get_unpaginated_response([])
        
    @action(detail=False, methods=['get'], url_path='student-ranks')
    def student_ranks(self, request):
        return ReportPagination().get_unpaginated_response([])
        
    @action(detail=False, methods=['get'], url_path='missing-parent-logins')
    def missing_parent_logins(self, request):
        return ReportPagination().get_unpaginated_response([])
        
    @action(detail=False, methods=['get'], url_path='student-id-cards')
    def student_id_cards(self, request):
        return ReportPagination().get_unpaginated_response([])
