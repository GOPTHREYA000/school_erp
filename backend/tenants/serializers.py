from rest_framework import serializers
from .models import Tenant, Branch, AcademicYear

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'slug', 'is_active', 'created_at', 'owner_email', 'owner_phone', 
            'logo_url', 'address', 'city', 'state', 'pincode', 'country',
            'admission_no_format', 'admission_no_prefix'
        ]
        read_only_fields = ['id', 'created_at', 'slug']

class BranchSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)

    class Meta:
        model = Branch
        fields = ['id', 'tenant', 'tenant_name', 'name', 'branch_code', 'address', 'is_active']
        read_only_fields = ['id', 'tenant']

class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = ['id', 'tenant', 'name', 'start_date', 'end_date', 'is_active']
        read_only_fields = ['id', 'tenant']
