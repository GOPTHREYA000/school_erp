import uuid
from django.db import models
from django.conf import settings

EXPENSE_STATUS = [
    ("DRAFT", "Draft"), ("SUBMITTED", "Submitted"),
    ("APPROVED", "Approved"), ("REJECTED", "Rejected"),
]
PAYMENT_MODE = [
    ("CASH", "Cash"), ("CHEQUE", "Cheque"), ("NEFT", "NEFT"),
    ("RTGS", "RTGS"), ("UPI", "UPI"), ("CARD", "Card"),
    ("BANK_TRANSFER", "Bank Transfer"),
]


class ExpenseCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='expense_categories')
    branch = models.ForeignKey('tenants.Branch', on_delete=models.CASCADE, related_name='expense_categories')
    name = models.CharField(max_length=100)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subcategories')
    code = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['branch', 'code']
        ordering = ['name']

    def __str__(self):
        return f"{self.code} - {self.name}"


class Vendor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='vendors')
    branch = models.ForeignKey('tenants.Branch', on_delete=models.CASCADE, related_name='vendors')
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=200, blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    gst_number = models.CharField(max_length=15, blank=True, null=True)
    pan_number = models.CharField(max_length=10, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Expense(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='expenses')
    branch = models.ForeignKey('tenants.Branch', on_delete=models.CASCADE, related_name='expenses')
    category = models.ForeignKey(ExpenseCategory, on_delete=models.CASCADE, related_name='expenses')
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    expense_date = models.DateField()
    payment_mode = models.CharField(max_length=15, choices=PAYMENT_MODE)
    reference_number = models.CharField(max_length=100, blank=True, null=True)
    voucher_number = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=EXPENSE_STATUS, default='DRAFT')
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='submitted_expenses')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_expenses')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    receipt_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-expense_date']
        unique_together = ['branch', 'voucher_number']

    def __str__(self):
        return f"{self.title} - ₹{self.amount}"


class TransactionLog(models.Model):
    """Unified cashbook entry — auto-generated from Payment and Expense status changes."""
    TX_TYPE = [("INCOME", "Income"), ("EXPENSE", "Expense")]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='transaction_logs')
    branch = models.ForeignKey('tenants.Branch', on_delete=models.CASCADE, related_name='transaction_logs')
    transaction_type = models.CharField(max_length=10, choices=TX_TYPE)
    category = models.CharField(max_length=100)
    reference_model = models.CharField(max_length=50)
    reference_id = models.UUIDField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255)
    transaction_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-transaction_date', '-created_at']

    def __str__(self):
        return f"{self.transaction_type}: ₹{self.amount} ({self.category})"
