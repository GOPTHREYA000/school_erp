from rest_framework import serializers
from .models import ExpenseCategory, Vendor, Expense, TransactionLog
from tenants.models import Branch

class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = '__all__'
        read_only_fields = ['id', 'tenant']

class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'tenant']

class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True, default=None)
    
    # Make these potentially optional for creation since we auto-populate
    category = serializers.PrimaryKeyRelatedField(queryset=ExpenseCategory.objects.all(), required=False)
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all(), required=False)
    expense_date = serializers.DateField(required=False)
    payment_mode = serializers.CharField(required=False, default='CASH')

    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'approved_at', 'tenant']

class TransactionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionLog
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'tenant']
