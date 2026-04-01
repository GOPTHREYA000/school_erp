import uuid
from django.db import models
from django.conf import settings

AUDIENCE_CHOICES = [("ALL", "All"), ("PARENTS", "Parents"), ("TEACHERS", "Teachers"), ("CLASS", "Specific Classes")]


class Announcement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='announcements')
    branch = models.ForeignKey('tenants.Branch', on_delete=models.CASCADE, related_name='announcements')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='announcements')
    title = models.CharField(max_length=200)
    body = models.TextField()
    target_audience = models.CharField(max_length=10, choices=AUDIENCE_CHOICES)
    target_classes = models.ManyToManyField('students.ClassSection', blank=True, related_name='announcements')
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    scheduled_for = models.DateTimeField(null=True, blank=True)
    send_sms = models.BooleanField(default=False)
    send_email = models.BooleanField(default=False)
    send_push = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at', '-created_at']

    def __str__(self):
        return self.title


class AnnouncementReadReceipt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name='read_receipts')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='read_receipts')
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['announcement', 'user']
