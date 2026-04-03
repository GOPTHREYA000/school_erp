from django.test import TestCase
from datetime import date
from rest_framework.test import APIClient
from accounts.models import User
from tenants.models import Tenant, Branch, AcademicYear
from students.models import Student
from fees.models import FeeInvoice
from django.urls import reverse

class SecurityAndIsolationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Tenant A Setup
        self.tenant_a = Tenant.objects.create(name='School A', owner_email='a@schoola.com', city='City', state='State', pincode='123456')
        self.branch_a = Branch.objects.create(name='Branch A', tenant=self.tenant_a)
        self.ay_a = AcademicYear.objects.create(name='2026-27', tenant=self.tenant_a, start_date='2026-06-01', end_date='2027-05-31')
        self.user_a = User.objects.create_user(email='admin@schoola.com', password='password123', tenant=self.tenant_a, branch=self.branch_a, role='SCHOOL_ADMIN')
        
        # Tenant B Setup
        self.tenant_b = Tenant.objects.create(name='School B', owner_email='b@schoolb.com', city='City', state='State', pincode='123456')
        self.branch_b = Branch.objects.create(name='Branch B', tenant=self.tenant_b)
        self.ay_b = AcademicYear.objects.create(name='2026-27', tenant=self.tenant_b, start_date='2026-06-01', end_date='2027-05-31')
        self.user_b = User.objects.create_user(email='admin@schoolb.com', password='password123', tenant=self.tenant_b, branch=self.branch_b, role='SCHOOL_ADMIN')
        
        # Data in Tenant A
        self.student_a = Student.objects.create(
            tenant=self.tenant_a,
            branch=self.branch_a,
            academic_year=self.ay_a,
            first_name='Student',
            last_name='A',
            date_of_birth='2010-01-01',
            status='ACTIVE'
        )
        
    def test_student_queryset_isolation(self):
        """User from Tenant B cannot see students from Tenant A."""
        self.client.force_authenticate(user=self.user_b)
        url = reverse('student-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)
        
        # Verify Tenant A user CAN see the student
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_fee_invoice_isolation(self):
        """User from Tenant B cannot see invoices from Tenant A."""
        FeeInvoice.objects.create(
            tenant=self.tenant_a,
            branch=self.branch_a,
            academic_year=self.ay_a,
            student=self.student_a,
            invoice_number='INV-A',
            month='2026-04',
            due_date=date(2026, 4, 30),
            gross_amount=100,
            net_amount=100,
            outstanding_amount=100
        )
        
        self.client.force_authenticate(user=self.user_b)
        url = reverse('feeinvoice-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)

    def test_clone_setup_cross_tenant_blocked(self):
        """School Admin cannot clone a setup from a different tenant."""
        self.client.force_authenticate(user=self.user_b)
        url = reverse('academic-year-clone-setup', args=[self.ay_a.id])
        response = self.client.post(url, {
            'name': '2027-28',
            'start_date': '2027-06-01',
            'end_date': '2028-05-31',
            'copy_fees': False
        }, format='json')
        self.assertEqual(response.status_code, 404)

    def test_accountant_cannot_create_users(self):
        """ACCOUNTANT role (rank 55) cannot create other users."""
        user_c = User.objects.create_user(
            email='accountant@schoola.com', 
            password='password123', 
            tenant=self.tenant_a, 
            branch=self.branch_a, 
            role='ACCOUNTANT'
        )
        self.client.force_authenticate(user=user_c)
        url = reverse('user-list')
        response = self.client.post(url, {
            'email': 'newteacher@schoola.com',
            'password': 'password123',
            'first_name': 'New',
            'last_name': 'Teacher',
            'role': 'TEACHER',
            'branch': self.branch_a.id
        }, format='json')
        self.assertEqual(response.status_code, 403)
        self.assertIn('You do not have permission to perform this action', str(response.data))

    def test_super_admin_tenant_validation(self):
        """SUPER_ADMIN cannot create a non-platform user without specifying a tenant."""
        super_admin = User.objects.create_user(
            email='super@admin.com', 
            password='password123', 
            role='SUPER_ADMIN'
        )
        self.client.force_authenticate(user=super_admin)
        url = reverse('user-list')
        response = self.client.post(url, {
            'email': 'someadmin@school.com',
            'password': 'password123',
            'first_name': 'Some',
            'last_name': 'Admin',
            'role': 'SCHOOL_ADMIN'
        }, format='json')
        # Expect either 403 or 400 since tenant is required
        self.assertIn(response.status_code, [400, 403])
        self.assertIn('Tenant', str(response.data))
