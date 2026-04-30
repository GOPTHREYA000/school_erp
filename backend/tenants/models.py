import uuid
from django.db import models
from django.conf import settings
from django.utils.text import slugify

class Plan(models.Model):
    name = models.CharField(max_length=100) # Starter, Growth, Enterprise
    max_branches = models.PositiveIntegerField(default=1)
    max_students = models.PositiveIntegerField(default=500)
    max_sms_monthly = models.PositiveIntegerField(default=1000)
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Tenant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, blank=True)
    admission_no_format = models.CharField(
        max_length=50, 
        choices=[
            ('YEAR_BRANCH_SEQ', 'YEAR/BRANCH/001'),
            ('BRANCH_YEAR_SEQ', 'BRANCH/YEAR/001'),
            ('YEAR_SEQ', 'YEAR/001'),
            ('PREFIX_SEQ', 'PREFIX-001'),
        ],
        default='YEAR_BRANCH_SEQ'
    )
    admission_no_prefix = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    owner_email = models.EmailField()
    owner_phone = models.CharField(max_length=15, blank=True)
    logo_url = models.URLField(blank=True, null=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=6)
    country = models.CharField(max_length=100, default="IN")

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Domain(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='domains')
    domain = models.CharField(max_length=255, unique=True)
    is_primary = models.BooleanField(default=True)

    def __str__(self):
        return self.domain

class Branch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=200)
    branch_code = models.CharField(max_length=50) # e.g. "MAIN"
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('tenant', 'branch_code')

    def __str__(self):
        return f"{self.name} ({self.tenant.name})"

class AcademicYear(models.Model):
    YEAR_STATUS_CHOICES = [
        ('PLANNING', 'Planning'),
        ('ACTIVE', 'Active'),
        ('CLOSING', 'Closing'),
        ('CLOSED', 'Closed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='academic_years')
    name = models.CharField(max_length=50) # e.g. "2024-2025"
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=YEAR_STATUS_CHOICES, default='PLANNING')
    closed_at = models.DateTimeField(null=True, blank=True)
    closed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='closed_academic_years'
    )

    class Meta:
        unique_together = ('tenant', 'name')
        constraints = [
            models.UniqueConstraint(
                fields=['tenant'],
                condition=models.Q(is_active=True),
                name='unique_active_academic_year_per_tenant'
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.tenant.name})"

class GlobalSetting(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField(blank=True) # Storing as text, frontend can parse as JSON if needed
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False) # If true, endpoint returns this setting without auth
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.key
