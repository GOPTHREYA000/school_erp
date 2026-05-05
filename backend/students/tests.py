from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse

from accounts.models import User
from tenants.models import Tenant, Branch, AcademicYear, Zone
from students.models import Student


class StudentAccessPolicyTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.tenant = Tenant.objects.create(
            name='Students Tenant',
            owner_email='owner@students.test',
            city='City',
            state='State',
            pincode='123456',
        )
        self.zone = Zone.objects.create(name='Students Zone', tenant=self.tenant)
        self.branch = Branch.objects.create(
            name='Students Branch',
            branch_code='STU1',
            tenant=self.tenant,
            zone=self.zone,
        )
        self.ay = AcademicYear.objects.create(
            name='2026-27',
            tenant=self.tenant,
            start_date='2026-06-01',
            end_date='2027-05-31',
        )
        self.student = Student.objects.create(
            tenant=self.tenant,
            branch=self.branch,
            academic_year=self.ay,
            first_name='A',
            last_name='Student',
            date_of_birth='2010-01-01',
            status='ACTIVE',
        )

    def test_chief_accountant_cannot_access_students_api(self):
        user = User.objects.create_user(
            email='chief@students.test',
            password='password123',
            tenant=self.tenant,
            role='CHIEF_ACCOUNTANT',
        )
        self.client.force_authenticate(user=user)
        response = self.client.get(reverse('student-list'))
        self.assertEqual(response.status_code, 403)
        self.assertIn('academic', str(response.data).lower())
