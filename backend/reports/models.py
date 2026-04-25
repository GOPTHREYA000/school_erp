import uuid
from django.db import models
from django.conf import settings

class ExportJob(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed')
    ]
    FORMAT_CHOICES = [
        ('EXCEL', 'Excel'),
        ('PDF', 'PDF')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='export_jobs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='export_jobs')
    report_type = models.CharField(max_length=100) # e.g. "ADMIT_APPLICANTS", "PAYMENTS_FEE_BALANCES"
    filters = models.JSONField(default=dict)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    file_url = models.CharField(max_length=500, blank=True, null=True)
    file_format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default='EXCEL')
    
    error_message = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.report_type} ({self.status})"

