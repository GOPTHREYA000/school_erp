# ScoolERP — Production-Grade PRD
## Part 3: Fee System, Expense Module, Notifications, Parent Portal & Accounting

---

## 11. FEE MANAGEMENT SYSTEM (FINANCIAL CRITICAL)

### 11.1 Fee Category Model

```python
class FeeCategory(models.Model):
    id          # UUID
    branch      # ForeignKey → Branch
    name        # CharField, max_length=100, required (e.g., "Tuition Fee")
    code        # CharField, max_length=20, unique within branch (e.g., "TUITION")
    description # TextField, nullable
    is_active   # BooleanField, default=True
    order       # PositiveIntegerField (display order on invoices)
    created_at  # DateTimeField, auto_now_add
```

### 11.2 Fee Structure Model

```python
class FeeStructure(models.Model):
    id              # UUID
    branch          # ForeignKey → Branch
    academic_year   # ForeignKey → AcademicYear
    grade           # CharField, choices=GRADE_CHOICES, required
    name            # CharField, max_length=200 (e.g., "Grade 1 Fee Plan 2025-26")
    is_active       # BooleanField, default=True
    created_by      # ForeignKey → User
    created_at      # DateTimeField, auto_now_add
    
    class Meta:
        unique_together = ["branch", "academic_year", "grade"]

class FeeStructureItem(models.Model):
    id              # UUID
    structure       # ForeignKey → FeeStructure, related_name="items"
    category        # ForeignKey → FeeCategory
    amount          # DecimalField(10, 2), required
    frequency       # CharField, choices=["ONE_TIME","MONTHLY","QUARTERLY","HALF_YEARLY","ANNUALLY"], required
    due_day         # PositiveIntegerField (day of month, 1–28; null for ONE_TIME)
    is_optional     # BooleanField, default=False
    
    class Meta:
        unique_together = ["structure", "category"]
```

**Business Rule:** `due_day` valid range: 1–28 (never 29/30/31 to avoid month-length issues). If `frequency=ONE_TIME`, `due_day` is null and due date is set manually per invoice.

### 11.3b Student Wallet (Advance Deposits)

```python
class StudentWallet(models.Model):
    id              # UUID
    student         # ForeignKey → Student, unique
    balance         # DecimalField(10, 2), default=0.00
    last_updated    # DateTimeField, auto_now=True

class WalletTransaction(models.Model):
    id              # UUID
    wallet          # ForeignKey → StudentWallet
    type            # CharField, choices=["CREDIT","DEBIT"]
    amount          # DecimalField(10, 2)
    reference_id    # UUID (fk to Payment or Invoice)
    created_at      # DateTimeField, auto_now_add
```

### 11.4 Fee Concession Model

```python
class FeeConcesssion(models.Model):
    id              # UUID
    branch          # ForeignKey → Branch
    name            # CharField, max_length=200 (e.g., "Sibling Discount 10%")
    concession_type # CharField, choices=["SIBLING","STAFF_WARD","SCHOLARSHIP","NEED_BASED","OTHER"], required
    discount_type   # CharField, choices=["FLAT","PERCENTAGE"], required
    discount_value  # DecimalField(10, 2) (e.g., 500.00 for FLAT, 10.00 for 10%)
    applies_to_categories # ManyToManyField → FeeCategory (null = applies to all)
    requires_approval     # BooleanField, default=True
    is_active       # BooleanField, default=True

class StudentConcession(models.Model):
    id              # UUID
    student         # ForeignKey → Student
    concession      # ForeignKey → FeeConcesssion
    approved_by     # ForeignKey → User, nullable
    approved_at     # DateTimeField, nullable
    valid_from      # DateField
    valid_until     # DateField, nullable (null = permanent)
    status          # CharField, choices=["PENDING","APPROVED","REJECTED"], default="PENDING"
    notes           # TextField, nullable
```

### 11.4 Late Fee Rules

```python
class LateFeeRule(models.Model):
    id              # UUID
    branch          # ForeignKey → Branch
    fee_category    # ForeignKey → FeeCategory, nullable (null = applies to all)
    grace_period_days # PositiveIntegerField, default=5
    penalty_type    # CharField, choices=["FLAT","PERCENTAGE"], required
    penalty_value   # DecimalField(10, 2) (e.g., 100.00 for FLAT, 2.00 for 2%)
    max_penalty     # DecimalField(10, 2), nullable (cap)
    is_active       # BooleanField, default=True
```

### 11.5 Invoice Model

```python
class FeeInvoice(models.Model):
    id                  # UUID
    invoice_number      # CharField, max_length=30, unique within branch (e.g., "INV-2025-04-001")
    student             # ForeignKey → Student
    branch              # ForeignKey → Branch
    academic_year       # ForeignKey → AcademicYear
    month               # CharField, max_length=7, nullable (e.g., "2026-04" for monthly)
    
    # Amounts
    gross_amount        # DecimalField(10, 2) (before concession)
    concession_amount   # DecimalField(10, 2), default=0.00
    late_fee_amount     # DecimalField(10, 2), default=0.00
    net_amount          # DecimalField(10, 2) (gross - concession + late_fee)
    paid_amount         # DecimalField(10, 2), default=0.00
    outstanding_amount  # DecimalField(10, 2) (computed: net - paid)
    
    # Dates
    due_date            # DateField, required
    issued_date         # DateField, default=today
    
    # Status
    status              # CharField, choices=["DRAFT","SENT","PARTIALLY_PAID","PAID","OVERDUE","WAIVED","CANCELLED"], default="DRAFT"
    
    # Admin
    generated_by        # CharField, choices=["AUTO","MANUAL"], default="AUTO"
    created_by          # ForeignKey → User, nullable
    cancelled_by        # ForeignKey → User, nullable
    cancellation_reason # TextField, nullable
    created_at          # DateTimeField, auto_now_add
    updated_at          # DateTimeField, auto_now

class FeeInvoiceItem(models.Model):
    id              # UUID
    invoice         # ForeignKey → FeeInvoice, related_name="items"
    category        # ForeignKey → FeeCategory
    original_amount # DecimalField(10, 2)
    concession      # DecimalField(10, 2), default=0.00
    final_amount    # DecimalField(10, 2)
    description     # CharField, max_length=200, nullable
```

**Invoice Number Format:** `INV-{YYYY}-{MM}-{SEQ:04d}` per branch, sequence resets monthly.

**Status Transitions (ENFORCED):**
```
DRAFT → SENT           → auto after generation + notification sent
SENT → PARTIALLY_PAID  → after partial payment recorded
SENT → PAID            → after full payment
SENT → OVERDUE         → after due_date passes and not paid (background job)
PARTIALLY_PAID → PAID  → after remaining amount paid
PARTIALLY_PAID → OVERDUE
SENT/OVERDUE → WAIVED  → admin action (requires reason)
SENT/OVERDUE → CANCELLED → admin action (requires reason)
```

**Endpoints:**
```
GET    /api/fees/invoices/
POST   /api/fees/invoices/generate/         → bulk generate for class or branch
GET    /api/fees/invoices/{id}/
PATCH  /api/fees/invoices/{id}/cancel/
PATCH  /api/fees/invoices/{id}/waive/
GET    /api/fees/invoices/{id}/pdf/
POST   /api/fees/invoices/{id}/send-reminder/
GET    /api/fees/invoices/defaulters/
```

**POST /api/fees/invoices/generate/ Request:**
```json
{
  "academic_year_id": "uuid",
  "month": "2026-04",
  "target": "CLASS",
  "class_section_id": "uuid"
}
```
`target` choices: `"CLASS"`, `"BRANCH"`, `"STUDENT"` (if `STUDENT`, provide `student_id`)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "generated": 38,
    "skipped_already_exists": 2,
    "errors": [],
    "job_id": "dq2-uuid"
  }
}
```
Generation is async (Django-Q2). Poll `GET /api/jobs/{job_id}/status/` for completion.

---

### 11.6 Payment Model

```python
class Payment(models.Model):
    id                  # UUID
    invoice             # ForeignKey → FeeInvoice
    student             # ForeignKey → Student (denormalized for fast queries)
    branch              # ForeignKey → Branch
    
    amount              # DecimalField(10, 2), required
    payment_mode        # CharField, choices=["ONLINE","CASH","CHEQUE","NEFT","RTGS","DD","UPI"], required
    payment_date        # DateField, required (date of actual payment)
    
    # Online Payment
    razorpay_order_id   # CharField, max_length=100, nullable
    razorpay_payment_id # CharField, max_length=100, nullable, unique
    razorpay_signature  # CharField, nullable (webhook verified)
    
    # Offline Payment
    reference_number    # CharField, max_length=100, nullable (cheque no., NEFT ref, etc.)
    bank_name           # CharField, max_length=100, nullable
    
    status              # CharField, choices=["PENDING","COMPLETED","FAILED","REFUNDED"], default="PENDING"
    collected_by        # ForeignKey → User (accountant/admin who recorded)
    
    # Approval (for offline payments)
    requires_approval   # BooleanField, default=False (True for offline payments > ₹500)
    approved_by         # ForeignKey → User, nullable
    approved_at         # DateTimeField, nullable
    
    receipt_number      # CharField, max_length=30, unique (auto-generated on COMPLETED)
    receipt_url         # URLField, nullable (PDF stored in R2)
    
    created_at          # DateTimeField, auto_now_add
    updated_at          # DateTimeField, auto_now
```

**Razorpay Integration Flow:**
1. `POST /api/payments/create-order/` → backend creates Razorpay order, returns `{order_id, amount, currency, key_id}`
2. Frontend renders Razorpay checkout modal
3. On user payment → Razorpay calls `POST /api/payments/webhook/razorpay/`
4. Webhook handler: verify HMAC signature → mark payment COMPLETED → update invoice → generate PDF receipt → trigger email + SMS
5. If webhook not received within 15 min of order creation → payment remains PENDING → cron checks Razorpay API for status

**POST /api/payments/create-order/ Request:**
```json
{ "invoice_id": "uuid" }
```
**Response 200:**
```json
{
  "success": true,
  "data": {
    "order_id": "order_xyz",
    "amount": 250000,
    "currency": "INR",
    "razorpay_key_id": "rzp_live_xxx",
    "student_name": "Riya Sharma",
    "invoice_number": "INV-2026-04-001"
  }
}
```

**POST /api/payments/offline/ Request:**
```json
{
  "invoice_id": "uuid",
  "amount": "2500.00",
  "payment_mode": "CASH",
  "payment_date": "2026-04-01",
  "reference_number": null,
  "collected_by_id": "uuid"
}
```

### 11.7 Receipt PDF Contents

Generated using WeasyPrint. Stored in R2 at: `r2://{tenant_slug}/receipts/{year}/{receipt_number}.pdf`

Must include:
- School logo (branch logo_url) + school name + branch name
- Receipt number + date
- Student name + admission number + class + section
- Payment mode + transaction ID / reference number
- Itemized list of categories paid
- Total amount paid (in digits + words)
- Balance outstanding (if partial)
- "PAID" watermark (green) if fully paid, "PARTIAL" if partial
- Authorized signature line (configurable text)

### 11.8 Defaulter Report

**GET /api/fees/defaulters/**

Query params: `?aging=30&grade=1&min_amount=1000`

`aging` choices: `30` (0–30 days overdue), `60` (31–60), `90` (61–90), `90_plus`

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": { "total_students": 12, "total_outstanding": "48500.00" },
    "records": [
      {
        "student_id": "uuid",
        "student_name": "Arjun Mehta",
        "admission_number": "2025-MN-019",
        "grade": "3",
        "section": "A",
        "parent_phone": "9876543210",
        "outstanding_amount": "7500.00",
        "overdue_since": "2026-03-10",
        "days_overdue": 22,
        "aging_band": "30",
        "last_payment_date": "2025-12-10"
      }
    ]
  }
}
```

**POST /api/fees/defaulters/send-reminder/**
```json
// Request
{ "student_ids": ["uuid1", "uuid2"], "message_template_id": "uuid" }
// Response
{ "success": true, "data": { "sms_queued": 2, "job_id": "dq2-uuid" } }
```

---

## 12. EXPENSE MODULE

### 12.1 Expense Category Model

```python
class ExpenseCategory(models.Model):
    id          # UUID
    branch      # ForeignKey → Branch
    name        # CharField, max_length=100, required
    parent      # ForeignKey → self, nullable (sub-categories)
    code        # CharField, max_length=20
    is_active   # BooleanField, default=True

# Seed categories per branch on creation:
DEFAULT_EXPENSE_CATEGORIES = [
    "Salaries & Wages", "Rent & Lease", "Utilities (Electricity/Water/Internet)",
    "Maintenance & Repairs", "Stationery & Supplies", "Transport (Bus/Fuel)",
    "Marketing & Events", "Academic Resources (Books/Lab)", "Miscellaneous"
]
```

### 12.2 Vendor Model

```python
class Vendor(models.Model):
    id          # UUID
    branch      # ForeignKey → Branch
    name        # CharField, max_length=200, required
    contact_person # CharField, max_length=200, nullable
    phone       # CharField, max_length=15, nullable
    email       # EmailField, nullable
    address     # TextField, nullable
    gst_number  # CharField, max_length=15, nullable
    pan_number  # CharField, max_length=10, nullable
    is_active   # BooleanField, default=True
    created_at  # DateTimeField, auto_now_add
```

### 12.3 Expense Model

```python
class Expense(models.Model):
    id              # UUID
    branch          # ForeignKey → Branch
    category        # ForeignKey → ExpenseCategory
    vendor          # ForeignKey → Vendor, nullable
    
    title           # CharField, max_length=200, required
    description     # TextField, nullable
    amount          # DecimalField(10, 2), required
    expense_date    # DateField, required
    payment_mode    # CharField, choices=["CASH","CHEQUE","NEFT","RTGS","UPI","CARD"], required
    reference_number # CharField, max_length=100, nullable
    
    # Approval
    status          # CharField, choices=["DRAFT","SUBMITTED","APPROVED","REJECTED"], default="DRAFT"
    submitted_by    # ForeignKey → User
    approved_by     # ForeignKey → User, nullable
    approved_at     # DateTimeField, nullable
    rejection_reason # TextField, nullable
    
    # Receipt
    receipt_url     # URLField, nullable (scanned receipt stored in R2)
    
    created_at      # DateTimeField, auto_now_add
    updated_at      # DateTimeField, auto_now
```

**Approval Rules:**
- Expenses < ₹5,000: Auto-approved on SUBMITTED (no manual action needed)
- Expenses ≥ ₹5,000: Requires SCHOOL_ADMIN approval
- Configuration per branch: `branch.expense_approval_threshold`

**Endpoints:**
```
GET    /api/expenses/
POST   /api/expenses/
GET    /api/expenses/{id}/
PUT    /api/expenses/{id}/
PATCH  /api/expenses/{id}/status/         → submit/approve/reject
GET    /api/expenses/summary/?month=2026-04
GET    /api/vendors/
POST   /api/vendors/
```

**GET /api/expenses/summary/?month=2026-04 Response:**
```json
{
  "success": true,
  "data": {
    "month": "2026-04",
    "total_approved": "148500.00",
    "total_pending": "25000.00",
    "by_category": [
      { "category": "Salaries & Wages", "amount": "95000.00", "percentage": 63.97 },
      { "category": "Utilities", "amount": "12000.00", "percentage": 8.08 }
    ]
  }
}
```

---

## 13. BASIC ACCOUNTING LAYER

### 13.1 Transaction Log (Cashbook)

All financial events (income + expense) auto-logged to this table:

```python
class TransactionLog(models.Model):
    id              # UUID
    branch          # ForeignKey → Branch
    transaction_type # CharField, choices=["INCOME","EXPENSE"], required
    category        # CharField, max_length=100 (e.g., "Tuition Fee", "Salaries")
    reference_model # CharField, max_length=50 (e.g., "Payment", "Expense")
    reference_id    # UUIDField (FK to Payment or Expense)
    amount          # DecimalField(10, 2)
    description     # CharField, max_length=255
    transaction_date # DateField
    created_at      # DateTimeField, auto_now_add
```

**Auto-Population Rules:**
- When `Payment.status → COMPLETED`: Create `TransactionLog(type="INCOME", reference_model="Payment", amount=payment.amount)`
- When `Expense.status → APPROVED`: Create `TransactionLog(type="EXPENSE", reference_model="Expense", amount=expense.amount)`
- These are READ-ONLY — no manual creation via API

### 13.2 Cashbook / Financial Summary

**GET /api/accounting/cashbook/?start_date=2026-04-01&end_date=2026-04-30**
```json
{
  "success": true,
  "data": {
    "period": { "start": "2026-04-01", "end": "2026-04-30" },
    "opening_balance": "0.00",
    "total_income": "285000.00",
    "total_expense": "148500.00",
    "net": "136500.00",
    "transactions": [
      { "date": "2026-04-01", "type": "INCOME", "category": "Tuition Fee", "amount": "5000.00", "description": "Payment for INV-2026-04-001 - Riya Sharma" },
      { "date": "2026-04-02", "type": "EXPENSE", "category": "Utilities", "amount": "8000.00", "description": "April electricity bill" }
    ]
  }
}
```

**GET /api/accounting/income-expense-summary/?year=2026**
Returns monthly totals for the whole academic year — used in dashboard charts.

### 13.3 Tally XML Export

**GET /api/accounting/tally-export/?start_date=2026-04-01&end_date=2026-04-30**
Generates and returns an XML file formatted for direct import into Tally ERP 9 / Tally Prime. Maps all `TransactionLog` entries to standard Tally ledgers (e.g., "Cash in Hand", "Bank Account", "Tuition Fee Income").

---

## 14. HOMEWORK / CLASS ACTIVITY MODULE

### 14.1 Model

```python
class Homework(models.Model):
    id              # UUID
    class_section   # ForeignKey → ClassSection
    subject         # ForeignKey → Subject
    posted_by       # ForeignKey → User (role=TEACHER)
    
    title           # CharField, max_length=200, required
    description     # TextField, required
    due_date        # DateField, required
    estimated_time_minutes # PositiveIntegerField, nullable (e.g., 30)
    
    activity_type   # CharField, choices=["HOMEWORK","CLASSWORK","PROJECT","REVISION","READING"], default="HOMEWORK"
    
    is_published    # BooleanField, default=True
    created_at      # DateTimeField, auto_now_add
    updated_at      # DateTimeField, auto_now

class HomeworkAttachment(models.Model):
    id          # UUID
    homework    # ForeignKey → Homework, related_name="attachments"
    file_url    # URLField (R2)
    file_name   # CharField, max_length=255
    file_type   # CharField, choices=["PDF","IMAGE","DOCUMENT","OTHER"]
    file_size_kb # PositiveIntegerField
    uploaded_at # DateTimeField, auto_now_add
```

**Business Rules:**
- Teacher can only create homework for own assigned `ClassSection` IDs
- `due_date` must be >= today (cannot post homework for past dates)
- Max 5 attachments per homework, max 10MB per file
- Files stored at: `r2://{tenant_slug}/homework/{homework_id}/{uuid}_{filename}`

**Endpoints:**
```
GET    /api/homework/?class_section_id={uuid}&date_from={}&date_to={}
POST   /api/homework/
GET    /api/homework/{id}/
PUT    /api/homework/{id}/
DELETE /api/homework/{id}/
POST   /api/homework/{id}/attachments/
DELETE /api/homework/{id}/attachments/{att_id}/
```

**GET /api/homework/ (Parent view via parent portal):**
- Scoped to: all class sections of parent's children
- Returns most recent 20, ordered by due_date ascending

---

## 15. NOTIFICATION SYSTEM (UNIFIED)

### 15.1 Notification Models

```python
class NotificationTemplate(models.Model):
    id              # UUID
    branch          # ForeignKey → Branch, nullable (null = global default)
    event_type      # CharField, choices=NOTIFICATION_EVENTS, unique within branch
    whatsapp_template_id # CharField, nullable (DLT approved template ID)
    whatsapp_vars   # JSONField, nullable
    sms_template    # TextField (use {{variable}} placeholders), nullable
    email_subject   # CharField, max_length=200, nullable
    email_body_html # TextField (HTML), nullable
    push_title      # CharField, max_length=100, nullable
    push_body       # CharField, max_length=200, nullable
    is_sms_enabled  # BooleanField, default=False (Expensive, opt-in)
    is_email_enabled # BooleanField, default=True
    is_push_enabled # BooleanField, default=True
    is_whatsapp_enabled # BooleanField, default=True
    updated_at      # DateTimeField, auto_now

NOTIFICATION_EVENTS = [
    "INVOICE_GENERATED",        # to parent
    "PAYMENT_CONFIRMED",        # to parent
    "PAYMENT_OVERDUE",          # to parent
    "ABSENCE_ALERT",            # to parent
    "ANNOUNCEMENT_PUBLISHED",   # to targeted roles
    "HOMEWORK_POSTED",          # to parent
    "PASSWORD_RESET",           # to user
    "WELCOME_ENROLLMENT",       # to parent
    "FEE_REMINDER_3DAYS",       # to parent (D-3 before due)
]

class NotificationLog(models.Model):
    id              # UUID
    branch          # ForeignKey → Branch
    event_type      # CharField
    recipient_user  # ForeignKey → User, nullable
    recipient_phone # CharField, max_length=15, nullable
    recipient_email # EmailField, nullable
    channel         # CharField, choices=["SMS","EMAIL","PUSH"], required
    status          # CharField, choices=["QUEUED","SENT","DELIVERED","FAILED"], default="QUEUED"
    payload         # JSONField (final rendered message)
    error_message   # TextField, nullable
    attempts        # PositiveIntegerField, default=0
    sent_at         # DateTimeField, nullable
    created_at      # DateTimeField, auto_now_add
```

### 15.2 Notification Service (Backend)

Central function `send_notification(event_type, recipient_user_id, context_data, channels)`:

1. Load `NotificationTemplate` for `event_type` (branch-specific first, fallback to global)
2. Render template with `context_data` variables
3. For each enabled channel:
   - Create `NotificationLog` with `status=QUEUED`
   - Dispatch as Django-Q2 background task
4. In background task:
   - **Push:** Primary channel. Call Firebase Web Push → retry up to 3 times.
   - **WhatsApp:** Call WATI / Interakt API → retry up to 3 times.
   - **Email:** Call Resend API → same retry logic.
   - **SMS:** Call MSG91 API → Only if explicitly enabled for the event, as it is expensive.
5. Channel fallback: Try Web Push first. If not subscribed/delivered, fallback to WhatsApp. If WhatsApp fails, fallback to SMS/Email.

**Endpoints:**
```
GET  /api/notifications/templates/
PUT  /api/notifications/templates/{event_type}/
GET  /api/notifications/logs/
GET  /api/notifications/logs/?status=FAILED&channel=SMS
POST /api/notifications/logs/{id}/retry/        → manual retry of failed notification
```

### 15.3 SMS Template Variables

| Variable | Value |
|---|---|
| `{{student_name}}` | Student first + last name |
| `{{class_section}}` | "Grade 1 - Section A" |
| `{{amount}}` | Formatted: "₹2,500.00" |
| `{{due_date}}` | Formatted: "10 Apr 2026" |
| `{{invoice_number}}` | "INV-2026-04-001" |
| `{{school_name}}` | Branch name |
| `{{parent_name}}` | Parent first name |
| `{{date}}` | Today's date |
| `{{payment_mode}}` | "Online / Cash / Cheque" |

---

## 16. ANNOUNCEMENT MODULE

```python
class Announcement(models.Model):
    id              # UUID
    branch          # ForeignKey → Branch
    created_by      # ForeignKey → User
    
    title           # CharField, max_length=200, required
    body            # TextField (rich HTML from TipTap), required
    
    target_audience # CharField, choices=["ALL","PARENTS","TEACHERS","CLASS"], required
    target_classes  # ManyToManyField → ClassSection (used when target=CLASS)
    
    is_published    # BooleanField, default=False
    published_at    # DateTimeField, nullable (auto-set when is_published → True)
    scheduled_for   # DateTimeField, nullable (if set, publish at this time via background job)
    
    send_sms        # BooleanField, default=False
    send_email      # BooleanField, default=False
    send_push       # BooleanField, default=True
    
    created_at      # DateTimeField, auto_now_add
    updated_at      # DateTimeField, auto_now

class AnnouncementReadReceipt(models.Model):
    announcement    # ForeignKey → Announcement
    user            # ForeignKey → User
    read_at         # DateTimeField, auto_now_add
    
    class Meta:
        unique_together = ["announcement", "user"]
```

**Endpoints:**
```
GET    /api/announcements/                      → scoped by role
POST   /api/announcements/
GET    /api/announcements/{id}/
PUT    /api/announcements/{id}/
DELETE /api/announcements/{id}/
PATCH  /api/announcements/{id}/publish/
POST   /api/announcements/{id}/mark-read/
GET    /api/announcements/{id}/read-receipts/   → admin only
```

---

## 17. PARENT PORTAL (PWA)

### 17.1 Child Selection
- Parent may have 1–10 children linked
- Portal shows child selector (avatar + name + class) at top
- All UI sections update when child is switched
- Default: first child alphabetically

### 17.2 Parent Home Screen
```
Sections (in order):
1. Active child banner (name, class, photo)
2. Fee Summary Card: Due amount + due date + [Pay Now] button
3. Today's Attendance Status: "Present ✓" / "Absent ✗" / "Not Marked Yet"
4. Today's Homework: Count + list (truncated to 3)
5. Recent Announcements: Last 3
6. Quick Actions: [Download Receipt] [View Timetable] [Contact School]
```

### 17.3 Parent API Endpoints (Scoped to own children only)

```
GET  /api/parent/children/                      → list of linked students
GET  /api/parent/children/{student_id}/profile/
GET  /api/parent/children/{student_id}/fees/invoices/
GET  /api/parent/children/{student_id}/fees/invoices/{id}/pdf/
POST /api/parent/children/{student_id}/fees/invoices/{id}/pay/
GET  /api/parent/children/{student_id}/attendance/?month=2026-04
GET  /api/parent/children/{student_id}/homework/
GET  /api/parent/children/{student_id}/timetable/
GET  /api/parent/announcements/                 → announcements for own children's classes
POST /api/parent/announcements/{id}/mark-read/
```

**Rule:** Every `/api/parent/` endpoint validates that `student_id` belongs to the authenticated parent via `ParentStudentRelation`. If not → `403 PERMISSION_DENIED`.

### 17.4 Parent-Teacher Helpdesk (Phase 3+)
- **2-Way Communication:** Parents can raise specific "Tickets" (e.g., "Leave Request", "Fee Query", "Academic Doubt").
- **Teacher Inbox:** Teachers see only tickets related to their students.
- **Resolution:** Tickets can be replied to and closed.

---

## 18. DATA MIGRATION SYSTEM

### 18.1 Import Job Model

```python
class ImportJob(models.Model):
    id              # UUID
    branch          # ForeignKey → Branch
    import_type     # CharField, choices=["STUDENTS","FEE_STRUCTURES","STAFF"], required
    uploaded_file_url # URLField (R2)
    status          # CharField, choices=["PENDING","VALIDATING","VALIDATED","IMPORTING","COMPLETED","FAILED"], default="PENDING"
    total_rows      # PositiveIntegerField, nullable
    valid_rows      # PositiveIntegerField, nullable
    invalid_rows    # PositiveIntegerField, nullable
    imported_rows   # PositiveIntegerField, nullable
    error_report_url # URLField, nullable (CSV of errors in R2)
    created_by      # ForeignKey → User
    created_at      # DateTimeField, auto_now_add
    completed_at    # DateTimeField, nullable
```

**Flow:**
```
POST /api/imports/upload/        → upload CSV → status=VALIDATING → async job
GET  /api/imports/{id}/status/   → poll for VALIDATED/FAILED
POST /api/imports/{id}/confirm/  → triggers actual import → status=IMPORTING → COMPLETED
GET  /api/imports/{id}/errors/   → download error CSV
```

---

## 19. AUDIT LOG SYSTEM

### 19.1 Async Audit Logging to R2

**CRITICAL OPIMIZATION:** Do NOT use PostgreSQL for standard row-level audit logging to avoid extreme database bloat during bulk operations.

- **Implementation:** Fire an async task (`django-q2`) on critical actions (e.g., Fee Deletion, Student Transfer, Login).
- **Storage:** The worker appends a JSONL entry to Cloudflare R2: `r2://{tenant_slug}/audit_logs/{year}-{month}.jsonl`
- **PostgreSQL Usage:** Only strictly critical transactional audit logs (like Payment Refunds or Invoice Cancellations) should touch the relational database if absolutely queried frequently in the UI.
- **Signals:** Remove global `post_save` signals. Explicitly log only where required in specific API views.

**Endpoints:**
```
GET  /api/audit-logs/           → paginated, SCHOOL_ADMIN+ only
     ?user_id=&model=&date_from=&date_to=&action=
GET  /api/audit-logs/{object_id}/   → logs for a specific record
```

---

## 20. SAAS BILLING (BASIC)

```python
class BillingSubscription(models.Model):  # in public schema
    id              # UUID
    tenant          # ForeignKey → Tenant
    plan            # ForeignKey → Plan
    status          # CharField, choices=["TRIAL","ACTIVE","PAST_DUE","CANCELLED","SUSPENDED"]
    trial_ends_at   # DateTimeField, nullable
    current_period_start # DateTimeField
    current_period_end   # DateTimeField
    sms_used_this_month  # PositiveIntegerField, default=0
    created_at      # DateTimeField, auto_now_add
```

**Quota Enforcement:**
- Before enrolling a student: Check `total active students in branch < plan.max_students`, else `QUOTA_EXCEEDED`
- Before sending SMS: Check `sms_used_this_month < plan.max_sms_monthly`, else skip SMS + notify admin
- Monthly cron at midnight on 1st: Reset `sms_used_this_month = 0`

---

*Continued in Part 4: Background Jobs, Reporting, Phase Roadmap, DoD Checklists*
