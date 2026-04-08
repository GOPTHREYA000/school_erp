import uuid
from django.db import models
from django.conf import settings

NOTIFICATION_EVENTS = [
    ("INVOICE_GENERATED", "Invoice Generated"), ("PAYMENT_CONFIRMED", "Payment Confirmed"),
    ("PAYMENT_OVERDUE", "Payment Overdue"), ("ABSENCE_ALERT", "Absence Alert"),
    ("ANNOUNCEMENT_PUBLISHED", "Announcement Published"), ("HOMEWORK_POSTED", "Homework Posted"),
    ("PASSWORD_RESET", "Password Reset"), ("WELCOME_ENROLLMENT", "Welcome Enrollment"),
    ("FEE_REMINDER_3DAYS", "Fee Reminder 3 Days"), ("CUSTOM_ANNOUNCEMENT", "Custom Announcement"),
]
CHANNEL_CHOICES = [("SMS", "SMS"), ("EMAIL", "Email"), ("PUSH", "Push"), ("WHATSAPP", "WhatsApp"), ("IN_APP", "In-App")]
LOG_STATUS = [("QUEUED", "Queued"), ("SENT", "Sent"), ("DELIVERED", "Delivered"), ("FAILED", "Failed")]


class NotificationTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, null=True, blank=True, related_name='notification_templates')
    branch = models.ForeignKey('tenants.Branch', on_delete=models.CASCADE, null=True, blank=True, related_name='notification_templates')
    event_type = models.CharField(max_length=30, choices=NOTIFICATION_EVENTS)
    whatsapp_template_id = models.CharField(max_length=100, blank=True, null=True)
    whatsapp_vars = models.JSONField(null=True, blank=True)
    sms_template = models.TextField(blank=True, null=True)
    email_subject = models.CharField(max_length=200, blank=True, null=True)
    email_body_html = models.TextField(blank=True, null=True)
    push_title = models.CharField(max_length=100, blank=True, null=True)
    push_body = models.CharField(max_length=200, blank=True, null=True)
    is_sms_enabled = models.BooleanField(default=False)
    is_email_enabled = models.BooleanField(default=True)
    is_push_enabled = models.BooleanField(default=True)
    is_whatsapp_enabled = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['branch', 'event_type']

    def __str__(self):
        return f"Template: {self.event_type} ({self.branch or 'Global'})"


class NotificationLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='notification_logs')
    branch = models.ForeignKey('tenants.Branch', on_delete=models.CASCADE, related_name='notification_logs')
    event_type = models.CharField(max_length=30, choices=NOTIFICATION_EVENTS)
    recipient_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='notification_logs')
    recipient_phone = models.CharField(max_length=15, blank=True, null=True)
    recipient_email = models.EmailField(blank=True, null=True)
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES)
    status = models.CharField(max_length=10, choices=LOG_STATUS, default='QUEUED')
    payload = models.JSONField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    attempts = models.PositiveIntegerField(default=0)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type} → {self.channel} ({self.status})"
