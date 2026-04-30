import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from accounts.models import User

teacher = User.objects.filter(role='TEACHER').first()
if teacher:
    print(f"Teacher found: {teacher.email}")
else:
    print("No teacher found!")
