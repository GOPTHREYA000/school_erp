from django.contrib import admin
from .models import AttendanceRecord

@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['student', 'class_section', 'date', 'status', 'marked_by']
    list_filter = ['status', 'date']
    search_fields = ['student__first_name', 'student__last_name']
