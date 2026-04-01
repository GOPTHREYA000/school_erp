from django.contrib import admin
from .models import Announcement, AnnouncementReadReceipt
@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'target_audience', 'is_published', 'published_at']
admin.site.register(AnnouncementReadReceipt)
