from django.contrib import admin
from .models import NotificationTemplate, NotificationLog
@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ['event_type', 'branch', 'is_email_enabled', 'is_push_enabled', 'is_whatsapp_enabled']
@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ['event_type', 'channel', 'status', 'recipient_email', 'created_at']
    list_filter = ['status', 'channel']
