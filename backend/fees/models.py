import uuid
from django.db import models
from django.conf import settings

FREQUENCY_CHOICES = [
    ("ONE_TIME", "One Time"), ("MONTHLY", "Monthly"), ("QUARTERLY", "Quarterly"),
    ("HALF_YEARLY", "Half Yearly"), ("ANNUALLY", "Annually"),
]
DISCOUNT_TYPE = [("FLAT", "Flat"), ("PERCENTAGE", "Percentage")]
CONCESSION_TYPE = [
    ("SIBLING", "Sibling"), ("STAFF_WARD", "Staff Ward"), ("SCHOLARSHIP", "Scholarship"),
    ("NEED_BASED", "Need Based"), ("OTHER", "Other"),
]
CONCESSION_STATUS = [("PENDING", "Pending"), ("APPROVED", "Approved"), ("REJECTED", "Rejected")]
INVOICE_STATUS = [
    ("DRAFT", "Draft"), ("SENT", "Sent"), ("PARTIALLY_PAID", "Partially Paid"),
    ("PAID", "Paid"), ("OVERDUE", "Overdue"), ("WAIVED", "Waived"), ("CANCELLED", "Cancelled"),
]
PAYMENT_MODE = [
    ("ONLINE", "Online"), ("CASH", "Cash"), ("CHEQUE", "Cheque"),
    ("NEFT", "NEFT"), ("RTGS", "RTGS"), ("DD", "DD"), ("UPI", "UPI"),
]
PAYMENT_STATUS = [
    ("PENDING", "Pending"), ("COMPLETED", "Completed"), ("FAILED", "Failed"), ("REFUNDED", "Refunded"),
]
GENERATED_BY = [("AUTO", "Auto"), ("MANUAL", "Manual")]
WALLET_TX_TYPE = [("CREDIT", "Credit"), ("DEBIT", "Debit")]


# ─── FeeCategory ────────────────────────────────────────────────
class FeeCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='fee_categories')
    branch = models.ForeignKey('tenants.Branch', on_delete=models.CASCADE, related_name='fee_categories')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['branch', 'code']
        ordering = ['order']

    def __str__(self):
        return f"{self.code} - {self.name}"


# ─── FeeStructure ───────────────────────────────────────────────
class FeeStructure(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='fee_structures')
    branch = models.ForeignKey('tenants.Branch', on_delete=models.CASCADE, related_name='fee_structures')
    academic_year = models.ForeignKey('tenants.AcademicYear', on_delete=models.CASCADE, related_name='fee_structures', db_index=True)
    grade = models.CharField(max_length=20, db_index=True)
    name = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_fee_structures')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['branch', 'academic_year', 'grade']

    def __str__(self):
        return self.name


class FeeStructureItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    structure = models.ForeignKey(FeeStructure, on_delete=models.CASCADE, related_name='items')
    category = models.ForeignKey(FeeCategory, on_delete=models.CASCADE, related_name='structure_items')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    frequency = models.CharField(max_length=15, choices=FREQUENCY_CHOICES)
    due_day = models.PositiveIntegerField(null=True, blank=True)
    is_optional = models.BooleanField(default=False)

    class Meta:
        unique_together = ['structure', 'category']

    def __str__(self):
        return f"{self.category.name}: ₹{self.amount} ({self.frequency})"


# ─── StudentWallet ──────────────────────────────────────────────
class StudentWallet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.OneToOneField('students.Student', on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Wallet: {self.student} (₹{self.balance})"


class WalletTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet = models.ForeignKey(StudentWallet, on_delete=models.CASCADE, related_name='transactions')
    type = models.CharField(max_length=10, choices=WALLET_TX_TYPE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reference_id = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


# ─── FeeConcession ──────────────────────────────────────────────
class FeeConcession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='fee_concessions')
    branch = models.ForeignKey('tenants.Branch', on_delete=models.CASCADE, related_name='fee_concessions')
    name = models.CharField(max_length=200)
    concession_type = models.CharField(max_length=20, choices=CONCESSION_TYPE)
    discount_type = models.CharField(max_length=15, choices=DISCOUNT_TYPE)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    applies_to_categories = models.ManyToManyField(FeeCategory, blank=True, related_name='concessions')
    requires_approval = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class StudentConcession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='concessions')
    concession = models.ForeignKey(FeeConcession, on_delete=models.CASCADE, related_name='student_concessions')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    valid_from = models.DateField()
    valid_until = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=CONCESSION_STATUS, default='PENDING')
    notes = models.TextField(blank=True, null=True)


# ─── LateFeeRule ────────────────────────────────────────────────
class LateFeeRule(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='late_fee_rules')
    branch = models.ForeignKey('tenants.Branch', on_delete=models.CASCADE, related_name='late_fee_rules')
    fee_category = models.ForeignKey(FeeCategory, on_delete=models.CASCADE, null=True, blank=True)
    grace_period_days = models.PositiveIntegerField(default=5)
    penalty_type = models.CharField(max_length=15, choices=DISCOUNT_TYPE)
    penalty_value = models.DecimalField(max_digits=10, decimal_places=2)
    max_penalty = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Late Fee: {self.penalty_value} ({self.penalty_type})"


# ─── FeeInvoice ─────────────────────────────────────────────────
class FeeInvoice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='fee_invoices')
    invoice_number = models.CharField(max_length=30)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='invoices')
    branch = models.ForeignKey('tenants.Branch', on_delete=models.CASCADE, related_name='invoices')
    academic_year = models.ForeignKey('tenants.AcademicYear', on_delete=models.CASCADE, related_name='invoices', db_index=True)
    month = models.CharField(max_length=7, blank=True, null=True, db_index=True)
    # Amounts
    gross_amount = models.DecimalField(max_digits=10, decimal_places=2)
    concession_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    late_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    outstanding_amount = models.DecimalField(max_digits=10, decimal_places=2)
    # Dates
    due_date = models.DateField()
    issued_date = models.DateField(auto_now_add=True)
    # Status
    status = models.CharField(max_length=20, choices=INVOICE_STATUS, default='DRAFT', db_index=True)
    # Admin
    generated_by = models.CharField(max_length=10, choices=GENERATED_BY, default='AUTO')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_invoices')
    cancelled_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='cancelled_invoices')
    cancellation_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['branch', 'invoice_number']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', 'month']),
            models.Index(fields=['branch', 'status', 'due_date']),
            models.Index(fields=['tenant', 'status', 'outstanding_amount']),
        ]
    def __str__(self):
        return f"{self.invoice_number} - {self.student}"


class FeeInvoiceItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(FeeInvoice, on_delete=models.CASCADE, related_name='items')
    category = models.ForeignKey(FeeCategory, on_delete=models.CASCADE, related_name='invoice_items')
    original_amount = models.DecimalField(max_digits=10, decimal_places=2)
    concession = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=200, blank=True, null=True)


# ─── Payment ────────────────────────────────────────────────────
class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='payments')
    invoice = models.ForeignKey(FeeInvoice, on_delete=models.CASCADE, related_name='payments')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='payments')
    branch = models.ForeignKey('tenants.Branch', on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_mode = models.CharField(max_length=10, choices=PAYMENT_MODE)
    payment_date = models.DateField()
    # Online Payment
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)
    # Offline Payment
    reference_number = models.CharField(max_length=100, blank=True, null=True)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    # Status
    status = models.CharField(max_length=10, choices=PAYMENT_STATUS, default='PENDING')
    collected_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='collected_payments')
    # Approval
    requires_approval = models.BooleanField(default=False)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_payments')
    approved_at = models.DateTimeField(null=True, blank=True)
    # Receipt
    receipt_number = models.CharField(max_length=30, blank=True, null=True, unique=True)
    receipt_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['invoice', 'status']),
            models.Index(fields=['branch', 'payment_date']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['razorpay_payment_id'],
                name='unique_razorpay_payment_id',
                condition=models.Q(razorpay_payment_id__isnull=False),
            ),
        ]

    def __str__(self):
        return f"Payment {self.receipt_number}: ₹{self.amount} ({self.status})"


# ─── StudentFeeItem ─────────────────────────────────────────────
class StudentFeeItem(models.Model):
    """Locks the agreed fee amount for a student for the academic year."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='fee_items')
    academic_year = models.ForeignKey('tenants.AcademicYear', on_delete=models.CASCADE)
    category = models.ForeignKey(FeeCategory, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_locked = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'academic_year', 'category']

    def __str__(self):
        return f"{self.student} - {self.category.name}: ₹{self.amount}"


# ─── FeeApprovalRequest ─────────────────────────────────────────
class FeeApprovalRequest(models.Model):
    """Workflow for fee reductions that need School Admin approval."""
    APPROVAL_STATUS = [("PENDING", "Pending"), ("APPROVED", "Approved"), ("REJECTED", "Rejected")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    branch = models.ForeignKey('tenants.Branch', on_delete=models.CASCADE)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='fee_approvals')
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='requested_fee_approvals')
    
    standard_total = models.DecimalField(max_digits=10, decimal_places=2)
    offered_total = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField(blank=True)
    
    status = models.CharField(max_length=15, choices=APPROVAL_STATUS, default='PENDING')
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_fee_approvals')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_remarks = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Fee Approval: {self.student} (₹{self.offered_total} < ₹{self.standard_total})"
