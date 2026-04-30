import os
import django
import sys
from io import StringIO
from django.core.files.uploadedfile import SimpleUploadedFile

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from tenants.models import Tenant, Branch, AcademicYear
from accounts.models import User
from rest_framework.test import APIRequestFactory, force_authenticate
from students.views import StudentViewSet
import json

def run_test():
    tenant = Tenant.objects.first()
    branch = Branch.objects.filter(tenant=tenant).first()
    ay = AcademicYear.objects.filter(tenant=tenant).first()
    
    admin_user = User.objects.filter(role='SUPER_ADMIN').first()
    
    csv_content = f"""first_name,last_name,date_of_birth,gender,grade,section,admission_number,father_name,father_phone,father_email,address
Test1,Student,2010-01-01,MALE,Grade 1,A,CSV-001,Test Father1,9999999901,f1@test.com,123 Test St
Test2,Student,15/05/2012,FEMALE,Grade 2,B,,Test Father2,9999999902,f2@test.com,456 Blank St
"""
    file_obj = SimpleUploadedFile("test.csv", csv_content.encode('utf-8'), content_type="text/csv")
    
    factory = APIRequestFactory()
    request = factory.post('/api/students/import-csv/', {
        'file': file_obj,
        'branch_id': str(branch.id),
        'academic_year_id': str(ay.id)
    }, format='multipart')
    
    force_authenticate(request, user=admin_user)
    view = StudentViewSet.as_view({'post': 'import_csv'})
    
    response = view(request)
    print("STATUS:", response.status_code)
    print("RESPONSE:", json.dumps(response.data, indent=2))

if __name__ == '__main__':
    run_test()
