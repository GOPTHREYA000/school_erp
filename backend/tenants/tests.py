from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse

from accounts.models import User
from tenants.models import Tenant, Branch, Zone


class TenantScopeAccessTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.tenant_a = Tenant.objects.create(
            name='Tenant A',
            owner_email='a@tenant.test',
            city='City',
            state='State',
            pincode='123456',
        )
        self.tenant_b = Tenant.objects.create(
            name='Tenant B',
            owner_email='b@tenant.test',
            city='City',
            state='State',
            pincode='123456',
        )
        self.zone_a1 = Zone.objects.create(name='A1', tenant=self.tenant_a)
        self.zone_a2 = Zone.objects.create(name='A2', tenant=self.tenant_a)
        self.zone_b1 = Zone.objects.create(name='B1', tenant=self.tenant_b)
        self.branch_a1 = Branch.objects.create(name='A-Branch-1', branch_code='A1', tenant=self.tenant_a, zone=self.zone_a1)
        self.branch_a2 = Branch.objects.create(name='A-Branch-2', branch_code='A2', tenant=self.tenant_a, zone=self.zone_a2)
        self.branch_b1 = Branch.objects.create(name='B-Branch-1', branch_code='B1', tenant=self.tenant_b, zone=self.zone_b1)

    def test_zonal_admin_sees_only_assigned_zone_branches(self):
        user = User.objects.create_user(
            email='zonal@tenant.test',
            password='password123',
            tenant=self.tenant_a,
            role='ZONAL_ADMIN',
        )
        user.zones.add(self.zone_a1)
        self.client.force_authenticate(user=user)
        response = self.client.get(reverse('branch-list'))
        self.assertEqual(response.status_code, 200)
        payload = response.data.get('data', response.data)
        returned_ids = {item['id'] for item in payload}
        self.assertIn(str(self.branch_a1.id), returned_ids)
        self.assertNotIn(str(self.branch_a2.id), returned_ids)
        self.assertNotIn(str(self.branch_b1.id), returned_ids)

    def test_owner_can_list_branches_across_tenants(self):
        owner = User.objects.create_user(
            email='owner@platform.test',
            password='password123',
            role='OWNER',
        )
        self.client.force_authenticate(user=owner)
        response = self.client.get(reverse('branch-list'))
        self.assertEqual(response.status_code, 200)
        payload = response.data.get('data', response.data)
        returned_ids = {item['id'] for item in payload}
        self.assertIn(str(self.branch_a1.id), returned_ids)
        self.assertIn(str(self.branch_a2.id), returned_ids)
        self.assertIn(str(self.branch_b1.id), returned_ids)
