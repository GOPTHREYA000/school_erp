from django.contrib import admin
from .models import (
    ClassSection, AdmissionInquiry, AdmissionApplication,
    ApplicationDocument, Student, ParentStudentRelation,
)

@admin.register(ClassSection)
class ClassSectionAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'branch', 'academic_year', 'grade', 'section', 'is_active']
    list_filter = ['branch', 'grade', 'is_active']

@admin.register(AdmissionInquiry)
class AdmissionInquiryAdmin(admin.ModelAdmin):
    list_display = ['student_first_name', 'student_last_name', 'grade_applying_for', 'status', 'created_at']
    list_filter = ['status', 'source']

@admin.register(AdmissionApplication)
class AdmissionApplicationAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'grade_applying_for', 'status', 'created_at']
    list_filter = ['status']

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['admission_number', 'first_name', 'last_name', 'class_section', 'status']
    list_filter = ['status', 'class_section']
    search_fields = ['first_name', 'last_name', 'admission_number']

@admin.register(ParentStudentRelation)
class ParentStudentRelationAdmin(admin.ModelAdmin):
    list_display = ['parent', 'student', 'relation_type', 'is_primary']

admin.site.register(ApplicationDocument)
