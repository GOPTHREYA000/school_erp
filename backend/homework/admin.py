from django.contrib import admin
from .models import Homework, HomeworkAttachment
@admin.register(Homework)
class HomeworkAdmin(admin.ModelAdmin):
    list_display = ['title', 'class_section', 'subject', 'due_date', 'activity_type']
admin.site.register(HomeworkAttachment)
