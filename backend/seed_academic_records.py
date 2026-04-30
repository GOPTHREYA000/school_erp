"""
Data migration: Create StudentAcademicRecord for all existing Student rows,
and set AcademicYear.status='ACTIVE' for currently active years.

Run: python manage.py shell < seed_academic_records.py
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import transaction
from students.models import Student, StudentAcademicRecord
from tenants.models import AcademicYear

print("=== Seeding StudentAcademicRecord from existing Student rows ===")

with transaction.atomic():
    # 1. Create academic records from existing students
    existing = set(
        StudentAcademicRecord.objects.values_list('student_id', 'academic_year_id')
    )
    
    students = Student.objects.select_related('academic_year', 'class_section').all()
    created = 0
    skipped = 0
    
    for student in students:
        if not student.academic_year_id:
            skipped += 1
            continue
            
        key = (student.id, student.academic_year_id)
        if key in existing:
            skipped += 1
            continue
        
        # Map student.status to record status
        status_map = {
            'ACTIVE': 'ACTIVE',
            'PENDING_APPROVAL': 'ACTIVE',
            'INACTIVE': 'ACTIVE',
            'TRANSFERRED': 'TRANSFERRED',
            'GRADUATED': 'GRADUATED',
            'DETAINED': 'DETAINED',
            'DROPOUT': 'DROPOUT',
        }
        record_status = status_map.get(student.status, 'ACTIVE')
        
        StudentAcademicRecord.objects.create(
            student=student,
            academic_year=student.academic_year,
            class_section=student.class_section,
            roll_number=student.roll_number,
            status=record_status,
        )
        created += 1
    
    print(f"  Created: {created} academic records")
    print(f"  Skipped: {skipped} (already exist or missing year)")
    
    # 2. Set status='ACTIVE' for currently active academic years
    updated = AcademicYear.objects.filter(is_active=True).update(status='ACTIVE')
    print(f"  Updated {updated} active academic years to status='ACTIVE'")
    
    # Set status='CLOSED' for inactive years that have data
    closed = AcademicYear.objects.filter(is_active=False).update(status='PLANNING')
    print(f"  Set {closed} inactive academic years to status='PLANNING'")

print("=== Done ===")
