import uuid
from django.db import models
from django.conf import settings


class TransportRoute(models.Model):
    """A named transport route managed by the school."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='transport_routes')
    branch = models.ForeignKey('tenants.Branch', on_delete=models.CASCADE, related_name='transport_routes')
    name = models.CharField(max_length=200)  # e.g. "Route A: School → Uppal → LB Nagar"
    start_point = models.CharField(max_length=200, default='School')
    end_point = models.CharField(max_length=200)
    distance_km = models.DecimalField(max_digits=6, decimal_places=2, help_text="Total route distance in km")
    stops = models.JSONField(default=list, blank=True, help_text="Ordered list of stop names")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        unique_together = ['branch', 'name']

    def __str__(self):
        return f"{self.name} ({self.distance_km} km)"


class TransportRateSlab(models.Model):
    """Distance-based pricing slab set by the school admin per branch."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='transport_rate_slabs')
    branch = models.ForeignKey('tenants.Branch', on_delete=models.CASCADE, related_name='transport_rate_slabs')
    min_km = models.DecimalField(max_digits=6, decimal_places=2)
    max_km = models.DecimalField(max_digits=6, decimal_places=2)
    monthly_rate = models.DecimalField(max_digits=10, decimal_places=2, help_text="Monthly fee in ₹ for this distance slab")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['min_km']

    def __str__(self):
        return f"{self.min_km}–{self.max_km} km → ₹{self.monthly_rate}/month"

    @classmethod
    def get_rate_for_distance(cls, branch, distance_km):
        """Returns the monthly rate for a given distance, or None if no slab matches."""
        slab = cls.objects.filter(
            branch=branch,
            is_active=True,
            min_km__lte=distance_km,
            max_km__gte=distance_km,
        ).first()
        return slab.monthly_rate if slab else None


class StudentTransport(models.Model):
    """Records a student's opt-in to a transport route."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.OneToOneField('students.Student', on_delete=models.CASCADE, related_name='transport')
    route = models.ForeignKey(TransportRoute, on_delete=models.CASCADE, related_name='students')
    distance_km = models.DecimalField(max_digits=6, decimal_places=2, help_text="Student's specific distance from school")
    pickup_point = models.CharField(max_length=200, blank=True)
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2, help_text="Resolved monthly fee from rate slab")
    is_active = models.BooleanField(default=True)
    opted_at = models.DateTimeField(auto_now_add=True)
    opted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='transport_optins'
    )

    class Meta:
        ordering = ['-opted_at']

    def __str__(self):
        return f"{self.student} → {self.route.name} ({self.distance_km} km, ₹{self.monthly_fee}/mo)"
