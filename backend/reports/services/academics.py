from django.db.models import Count, Q
from students.models import Student
from attendance.models import AttendanceRecord
from reports.services.base import BaseReportService

class AcademicsService:
    @staticmethod
    def get_students(filters):
        qs = Student.objects.select_related('class_section', 'academic_year', 'branch')
        qs = BaseReportService.apply_branch_scope(qs, filters)
        qs = BaseReportService.apply_academic_year(qs, filters.academic_year_id)
        
        if filters.class_id:
            qs = qs.filter(class_section__grade=filters.class_id)
        if filters.section_id:
            qs = qs.filter(class_section_id=filters.section_id)
        if filters.status:
            qs = qs.filter(status=filters.status)
            
        return qs.order_by('class_section__grade', 'class_section__section', 'first_name')

    @staticmethod
    def get_student_strength(filters):
        qs = Student.objects.filter(status='ACTIVE')
        qs = BaseReportService.apply_branch_scope(qs, filters)
        qs = BaseReportService.apply_academic_year(qs, filters.academic_year_id)
        
        return qs.values('gender', 'caste_category').annotate(count=Count('id')).order_by('gender', 'caste_category')

    @staticmethod
    def get_student_attendance_daily(filters):
        qs = AttendanceRecord.objects.select_related('student', 'class_section')
        qs = qs.filter(tenant=filters.user.tenant)
        if filters.branch_id:
            qs = qs.filter(class_section__branch_id=filters.branch_id)
            
        qs = BaseReportService.apply_date_range(qs, 'date', filters.start_date, filters.end_date)
        
        if filters.class_id:
            qs = qs.filter(class_section__grade=filters.class_id)
        if filters.section_id:
            qs = qs.filter(class_section_id=filters.section_id)
            
        return qs.order_by('-date', 'student__first_name')
