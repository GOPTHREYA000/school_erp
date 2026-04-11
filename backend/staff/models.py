import uuid
from django.db import models
from django.conf import settings

class TeacherProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='teacher_profiles')
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='teacher_profile')
    branch = models.ForeignKey('tenants.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='teacher_profiles')
    employee_id = models.CharField(max_length=50, unique=True, blank=True) # Blank=True for auto-gen
    qualification = models.CharField(max_length=200, blank=True)
    specialization = models.CharField(max_length=200, blank=True) # e.g. "Mathematics"
    joining_date = models.DateField(null=True, blank=True)
    bio = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.employee_id and self.branch:
            # Format: [Branch Code]-STAFF_[Counter] (e.g. KGS-STAFF_001)
            prefix = f"{self.branch.branch_code}-STAFF_"
            
            # Count existing teachers with this prefix across all branches to guarantee sequence uniqueness
            last_staff = TeacherProfile.objects.filter(
                employee_id__startswith=prefix
            ).order_by('-employee_id').first()
            
            seq = 1
            if last_staff:
                import re
                # Extract sequence from the end (e.g. 001)
                match = re.search(r'(\d+)$', last_staff.employee_id)
                if match:
                    seq = int(match.group(1)) + 1
            
            self.employee_id = f"{prefix}{seq:03d}"
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} ({self.employee_id})"

class TeacherAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='teacher_assignments')
    teacher = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE, related_name='assignments')
    class_section = models.ForeignKey('students.ClassSection', on_delete=models.CASCADE, related_name='teacher_assignments')
    subject = models.ForeignKey('timetable.Subject', on_delete=models.CASCADE, related_name='teacher_assignments')
    is_class_teacher = models.BooleanField(default=False)
    academic_year = models.ForeignKey('tenants.AcademicYear', on_delete=models.CASCADE, related_name='teacher_assignments')

    class Meta:
        unique_together = ('class_section', 'subject', 'academic_year') # One subject per class per year? Or multiple? Usually one.

    def __str__(self):
        return f"{self.teacher} -> {self.class_section} ({self.subject.name})"
