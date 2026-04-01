# ScoolERP — Production-Grade PRD
## Part 2: Student System, Admissions, Enrollment, Parent Relations, Attendance & Timetable

---

## 7. STUDENT INFORMATION SYSTEM (SIS)

### 7.1 Admissions Flow

```
INQUIRY → APPLICATION → DOCUMENT_REVIEW → APPROVED/REJECTED → ENROLLED
```

Each status is a discrete state. Transitions are role-gated. No skipping states.

#### 7.1.1 Inquiry Model

```python
class AdmissionInquiry(models.Model):
    id                  # UUID
    branch              # ForeignKey → Branch
    student_first_name  # CharField, max_length=100, required
    student_last_name   # CharField, max_length=100, required
    date_of_birth       # DateField, required
    gender              # CharField, choices=["MALE","FEMALE","OTHER"], required
    grade_applying_for  # CharField, choices=GRADE_CHOICES, required
    parent_name         # CharField, max_length=200, required
    parent_phone        # CharField, max_length=15, required (validated: 10 digits)
    parent_email        # EmailField, required
    source              # CharField, choices=["WALK_IN","WEBSITE","REFERRAL","SOCIAL_MEDIA","OTHER"], default="WEBSITE"
    notes               # TextField, nullable
    status              # CharField, choices=["NEW","CONTACTED","CONVERTED","LOST"], default="NEW"
    academic_year       # ForeignKey → AcademicYear
    created_at          # DateTimeField, auto_now_add
    assigned_to         # ForeignKey → User, nullable (admin who follows up)

GRADE_CHOICES = ["NURSERY","LKG","UKG","1","2","3","4","5","6","7","8","9","10","11_SCIENCE","11_COMMERCE","11_ARTS","12_SCIENCE","12_COMMERCE","12_ARTS"]
```

**Edge Cases:**
- Duplicate inquiry (same phone + same grade + same academic year): Return `CONFLICT` error with existing inquiry ID
- If branch has reached `Plan.max_students` already: Return `QUOTA_EXCEEDED` before saving

**Endpoints:**
```
GET    /api/admissions/inquiries/
POST   /api/admissions/inquiries/          → PUBLIC (no auth) + authenticated
PATCH  /api/admissions/inquiries/{id}/status/
```

**POST /api/admissions/inquiries/ Request:**
```json
{
  "student_first_name": "Riya",
  "student_last_name": "Sharma",
  "date_of_birth": "2018-04-15",
  "gender": "FEMALE",
  "grade_applying_for": "1",
  "parent_name": "Suresh Sharma",
  "parent_phone": "9876543210",
  "parent_email": "suresh@gmail.com",
  "source": "WEBSITE"
}
```
**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "NEW",
    "message": "Inquiry submitted. Our team will contact you within 24 hours."
  }
}
```
**Auto-trigger:** Send acknowledgement email via Resend on successful inquiry creation.

#### 7.1.2 Application Model

```python
class AdmissionApplication(models.Model):
    id                      # UUID
    inquiry                 # ForeignKey → AdmissionInquiry, nullable
    branch                  # ForeignKey → Branch
    academic_year           # ForeignKey → AcademicYear
    status                  # CharField, choices=APPLICATION_STATUS, default="DRAFT"
    
    # Student Info
    first_name              # CharField, max_length=100, required
    last_name               # CharField, max_length=100, required
    date_of_birth           # DateField, required
    gender                  # CharField, choices=["MALE","FEMALE","OTHER"], required
    blood_group             # CharField, choices=["A+","A-","B+","B-","AB+","AB-","O+","O-","UNKNOWN"], default="UNKNOWN"
    nationality             # CharField, max_length=100, default="Indian"
    religion                # CharField, max_length=100, nullable
    caste_category          # CharField, choices=["GENERAL","OBC","SC","ST","OTHER"], nullable
    aadhar_number           # CharField, max_length=12, nullable (encrypted at field level)
    previous_school_name    # CharField, max_length=200, nullable
    previous_class          # CharField, max_length=20, nullable
    reason_for_leaving      # TextField, nullable
    grade_applying_for      # CharField, choices=GRADE_CHOICES, required
    
    # Father Info
    father_name             # CharField, max_length=200, required
    father_phone            # CharField, max_length=15, required
    father_email            # EmailField, nullable
    father_occupation       # CharField, max_length=200, nullable
    father_annual_income    # CharField, choices=INCOME_CHOICES, nullable
    
    # Mother Info
    mother_name             # CharField, max_length=200, required
    mother_phone            # CharField, max_length=15, nullable
    mother_email            # EmailField, nullable
    mother_occupation       # CharField, max_length=200, nullable
    
    # Address
    address_line1           # CharField, max_length=255, required
    address_line2           # CharField, max_length=255, nullable
    city                    # CharField, max_length=100, required
    state                   # CharField, max_length=100, required
    pincode                 # CharField, max_length=6, required
    
    # Emergency Contact
    emergency_contact_name  # CharField, max_length=200, required
    emergency_contact_phone # CharField, max_length=15, required
    emergency_contact_relation # CharField, max_length=100, required
    
    # Medical
    has_medical_condition   # BooleanField, default=False
    medical_details         # TextField, nullable
    allergies               # TextField, nullable
    doctor_name             # CharField, max_length=200, nullable
    doctor_phone            # CharField, max_length=15, nullable
    
    # Admin & Fees
    sibling_link            # ForeignKey → Student, nullable (auto-lookup to link existing sibling)
    application_fee_paid    # BooleanField, default=False
    application_fee_amount  # DecimalField(10,2), default=0.00
    remarks                 # TextField, nullable (admin remarks on review)
    reviewed_by             # ForeignKey → User, nullable
    reviewed_at             # DateTimeField, nullable
    submitted_at            # DateTimeField, nullable
    created_at              # DateTimeField, auto_now_add
    updated_at              # DateTimeField, auto_now

APPLICATION_STATUS = ["DRAFT","SUBMITTED","UNDER_REVIEW","APPROVED","REJECTED","ENROLLED"]
INCOME_CHOICES = ["BELOW_2L","2L_5L","5L_10L","10L_20L","ABOVE_20L"]
```

**Status Transitions (Enforced):**
```
DRAFT → SUBMITTED        (parent/admin submits)
SUBMITTED → UNDER_REVIEW (admin opens for review)
UNDER_REVIEW → APPROVED  (admin approves)
UNDER_REVIEW → REJECTED  (admin rejects with remarks required)
APPROVED → ENROLLED      (admin converts → creates Student record)
ENROLLED → (terminal)
REJECTED → (terminal)
```

**Edge Case:** If `APPROVED → ENROLLED` and the branch is at `max_students` limit → block with `QUOTA_EXCEEDED`.

**Endpoints:**
```
GET    /api/admissions/applications/
POST   /api/admissions/applications/
GET    /api/admissions/applications/{id}/
PUT    /api/admissions/applications/{id}/
PATCH  /api/admissions/applications/{id}/status/
POST   /api/admissions/applications/{id}/enroll/     → creates Student + triggers fee assignment
GET    /api/admissions/applications/{id}/documents/
POST   /api/admissions/applications/{id}/documents/
```

**PATCH /api/admissions/applications/{id}/status/ Request:**
```json
{ "status": "REJECTED", "remarks": "Documents incomplete. DOB certificate missing." }
```
**Validation:** `remarks` is required when `status = "REJECTED"`.

#### 7.1.3 Application Document Model

```python
class ApplicationDocument(models.Model):
    id              # UUID
    application     # ForeignKey → AdmissionApplication (or Student after enrollment)
    doc_type        # CharField, choices=DOC_TYPES, required
    file_url        # URLField (Cloudflare R2 URL), required
    file_name       # CharField, max_length=255
    file_size_kb    # PositiveIntegerField
    expiry_date     # DateField, nullable (for Visas, Medical Certs)
    uploaded_at     # DateTimeField, auto_now_add
    is_verified     # BooleanField, default=False

DOC_TYPES = ["BIRTH_CERTIFICATE","PASSPORT_PHOTO","AADHAR_CARD","PREVIOUS_MARKSHEET","TRANSFER_CERTIFICATE","INCOME_PROOF","CASTE_CERTIFICATE","MEDICAL_CERTIFICATE","OTHER"]
```

**File Upload Rules:**
- Max file size: 5 MB per document
- Allowed types: PDF, JPG, JPEG, PNG
- Files stored at: `r2://{tenant_slug}/admissions/{application_id}/{doc_type}_{uuid}.{ext}`
- Pre-signed upload URL issued by backend — frontend uploads directly to R2

---

### 7.2 Student Model

Created automatically when application status → `ENROLLED`, or manually by admin.

```python
class Student(models.Model):
    id                  # UUID, primary_key
    branch              # ForeignKey → Branch
    academic_year       # ForeignKey → AcademicYear (enrollment year)
    admission_number    # CharField, max_length=20, unique within branch
    
    # Personal
    first_name          # CharField, max_length=100, required
    last_name           # CharField, max_length=100, required
    date_of_birth       # DateField, required
    gender              # CharField, choices=["MALE","FEMALE","OTHER"], required
    blood_group         # CharField, choices=BLOOD_GROUPS, default="UNKNOWN"
    nationality         # CharField, default="Indian"
    religion            # CharField, nullable
    caste_category      # CharField, choices=CASTE_CHOICES, nullable
    aadhar_number       # CharField, max_length=12, nullable (encrypted)
    photo_url           # URLField, nullable
    
    # Academic
    class_section       # ForeignKey → ClassSection, nullable
    roll_number         # PositiveIntegerField, nullable
    
    # Status
    status              # CharField, choices=["ACTIVE","INACTIVE","TRANSFERRED","GRADUATED","DETAINED"], default="ACTIVE"
    enrollment_date     # DateField, required (auto-set to today)
    leaving_date        # DateField, nullable
    leaving_reason      # TextField, nullable
    
    # Source
    application         # ForeignKey → AdmissionApplication, nullable, on_delete=SET_NULL
    
    # Audit
    created_by          # ForeignKey → User
    created_at          # DateTimeField, auto_now_add
    updated_at          # DateTimeField, auto_now
```

**Admission Number Auto-Generation:**
- Format configurable per branch: e.g., `{YEAR}-{BRANCH_CODE}-{SEQ}` → `2025-MN-001`
- Sequence resets per academic year per branch
- If manual admission_number provided and already exists → `CONFLICT` error

**Endpoints:**
```
GET    /api/students/                     → paginated list
POST   /api/students/                     → manual creation
GET    /api/students/{id}/
PUT    /api/students/{id}/
PATCH  /api/students/{id}/status/
DELETE /api/students/{id}/               → NOT allowed; use PATCH status=INACTIVE
GET    /api/students/{id}/fees/          → student's fee summary
GET    /api/students/{id}/attendance/    → attendance records
GET    /api/students/{id}/homework/      → assigned homework
POST   /api/students/bulk-import/        → CSV upload
GET    /api/students/bulk-import/template/ → download CSV template
```

**GET /api/students/ Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "admission_number": "2025-MN-001",
      "first_name": "Riya",
      "last_name": "Sharma",
      "gender": "FEMALE",
      "date_of_birth": "2018-04-15",
      "class_section": { "id": "uuid", "grade": "1", "section": "A", "display": "Grade 1 - A" },
      "status": "ACTIVE",
      "photo_url": null,
      "outstanding_fees": "2500.00",
      "attendance_percentage": 94.5
    }
  ],
  "meta": { "page": 1, "page_size": 20, "total": 142, "total_pages": 8 }
}
```

**Filters on GET /api/students/:**
- `?status=ACTIVE&class_section_id=uuid&gender=FEMALE&search=Riya`

---

### 7.3 CSV Bulk Import

**POST /api/students/bulk-import/**
1. Accept: multipart/form-data with `file` field (CSV, max 5MB, max 500 rows per upload)
2. Parse and validate all rows — do NOT save yet
3. Return validation report showing: valid rows count, invalid rows count, error details per row
4. Frontend shows preview
5. User clicks "Confirm Import" → **POST /api/students/bulk-import/confirm/** with `import_id`
6. System saves all valid rows, skips invalid, returns final summary

**Validation Rules per Row:**
- `first_name`, `last_name`: required, non-empty
- `date_of_birth`: valid date, format YYYY-MM-DD, student must be between 3–25 years old
- `gender`: must be MALE/FEMALE/OTHER (case-insensitive)
- `grade_applying_for`: must be in GRADE_CHOICES
- `parent_phone`: exactly 10 digits
- `parent_email`: valid email format (optional)
- Duplicate `admission_number` within same branch/year → row error

**Error Report Row Example:**
```json
{
  "row": 5,
  "data": { "first_name": "Raj", "date_of_birth": "not-a-date" },
  "errors": ["date_of_birth: Enter a valid date in YYYY-MM-DD format."]
}
```

---

### 7.4 Class & Section Management

```python
class ClassSection(models.Model):
    id              # UUID
    branch          # ForeignKey → Branch
    academic_year   # ForeignKey → AcademicYear
    grade           # CharField, choices=GRADE_CHOICES, required
    section         # CharField, max_length=5, required (e.g., "A", "B")
    display_name    # CharField, max_length=50 (e.g., "Grade 1 - Section A")
    class_teacher   # ForeignKey → User (role=TEACHER), nullable
    max_capacity    # PositiveIntegerField, default=40
    is_active       # BooleanField, default=True
    
    class Meta:
        unique_together = ["branch", "academic_year", "grade", "section"]
```

**Edge Case:** Assigning a `class_teacher` who is already the class teacher of another section in the same branch/year → allowed (teachers can handle multiple sections), but warn via response `"warnings": ["This teacher is already assigned to Grade 2 - B."]`.

**Endpoints:**
```
GET    /api/classes/
POST   /api/classes/
GET    /api/classes/{id}/
PUT    /api/classes/{id}/
GET    /api/classes/{id}/students/       → paginated student list for this class
POST   /api/classes/{id}/assign-students/ → bulk assign student IDs to this class
```

---

### 7.5 Parent-Student Relationship Model

**CRITICAL:** One parent can have multiple children. One child can have multiple parents. Relationship type is mandatory.

```python
class ParentStudentRelation(models.Model):
    id              # UUID
    parent          # ForeignKey → User (role=PARENT), required
    student         # ForeignKey → Student, required
    relation_type   # CharField, choices=["FATHER","MOTHER","GUARDIAN","SIBLING","OTHER"], required
    is_primary      # BooleanField, default=False (primary contact gets all alerts)
    can_pickup      # BooleanField, default=True (authorized for pickup)
    created_at      # DateTimeField, auto_now_add
    
    class Meta:
        unique_together = ["parent", "student"]
```

**Rules:**
- Each student must have AT LEAST ONE relation with `is_primary=True`
- If creating a relation and no primary exists, auto-set new relation as primary
- Only `is_primary=True` parent receives SMS/email alerts unless system sends to all
- When parent logs in, they see ALL students linked via their `ParentStudentRelation` records

**Endpoints:**
```
GET    /api/parent-relations/                       → list (scoped to branch admin)
POST   /api/parent-relations/                       → admin creates relation
DELETE /api/parent-relations/{id}/
GET    /api/students/{id}/parents/                  → all parents for a student
GET    /api/parent/children/                        → parent sees own children (role=PARENT)
```

**POST /api/parent-relations/ Request:**
```json
{
  "parent_id": "uuid",
  "student_id": "uuid",
  "relation_type": "MOTHER",
  "is_primary": true,
  "can_pickup": true
}
```

---

### 7.6 Student Year-End Promotion

**POST /api/students/promote/**
```json
// Request
{
  "source_academic_year_id": "uuid",
  "target_academic_year_id": "uuid",
  "class_section_id": "uuid",
  "exclude_student_ids": ["uuid1", "uuid2"],
  "promote_to_grade": "2",
  "promote_to_section": "A"
}
// Response 200
{
  "success": true,
  "data": {
    "promoted": 38,
    "excluded": 2,
    "errors": []
  }
}
```
**Rules:** 
- Only SCHOOL_ADMIN can trigger promotion
- Creates new student-class_section assignment for target academic year
- Does NOT delete the original; adds new `ClassSection` record pointing to new year
- Students with `status != ACTIVE` are automatically excluded

---

### 7.7 Transfer Certificate

**POST /api/students/{id}/transfer-certificate/**
```json
// Request
{ "leaving_date": "2026-03-31", "leaving_reason": "Family relocation" }
// Response 200
{
  "success": true,
  "data": {
    "pdf_url": "https://r2.scoolerp.in/..../tc_2025-MN-001.pdf",
    "student_id": "uuid",
    "tc_number": "TC-2025-042"
  }
}
```
Auto-sets `student.status = "TRANSFERRED"` and `student.leaving_date`.

---

## 8. ATTENDANCE SYSTEM

### 8.1 Attendance Model

```python
class AttendanceRecord(models.Model):
    id              # UUID
    student         # ForeignKey → Student
    class_section   # ForeignKey → ClassSection
    date            # DateField, required
    status          # CharField, choices=["PRESENT","ABSENT","LATE","HALF_DAY","ON_LEAVE"], required
    marked_by       # ForeignKey → User (role=TEACHER or SCHOOL_ADMIN)
    marked_at       # DateTimeField, auto_now_add
    remarks         # CharField, max_length=200, nullable
    
    class Meta:
        unique_together = ["student", "date"]
```

### 8.2 Bulk Attendance Marking (Teacher PWA Daily Flow)

**CRITICAL:** The Teacher UI for attendance MUST be a blazing-fast Mobile PWA to prevent teacher friction.

**POST /api/attendance/bulk/**
```json
// Request
{
  "class_section_id": "uuid",
  "date": "2026-04-01",
  "records": [
    { "student_id": "uuid1", "status": "PRESENT" },
    { "student_id": "uuid2", "status": "ABSENT", "remarks": "Fever" },
    { "student_id": "uuid3", "status": "LATE" }
  ]
}
// Response 201
{
  "success": true,
  "data": {
    "saved": 38,
    "already_marked": 0,
    "errors": []
  }
}
```

**Business Rules:**
- Teacher can only mark attendance for own assigned `ClassSection` IDs
- Admin can mark/edit for any class in their branch
- Bulk UI must easily support marking `HALF_DAY` for students leaving early.
- Attendance for a date can only be submitted once per class. Re-submission overwrites (with audit log: old value, new value, changed by, changed at)
- Cannot mark attendance for future dates
- Cannot mark attendance for holidays (holiday model not in MVP — validate only against weekends if `branch.working_days` includes Saturday/Sunday)
- If date is a Sunday (or Saturday if 5-day week) → return `VALIDATION_ERROR: "Cannot mark attendance on a non-working day."`

**GET /api/attendance/?class_section_id={uuid}&date={YYYY-MM-DD}**
```json
{
  "success": true,
  "data": {
    "class_section": { "id": "uuid", "display": "Grade 1 - A" },
    "date": "2026-04-01",
    "is_submitted": true,
    "total_students": 38,
    "present": 35,
    "absent": 2,
    "late": 1,
    "records": [
      { "student_id": "uuid", "student_name": "Riya Sharma", "status": "PRESENT", "remarks": null }
    ]
  }
}
```

**GET /api/attendance/summary/?student_id={uuid}&month={2026-03}**
Returns: total_days, present_days, absent_days, late_days, attendance_percentage

**GET /api/attendance/class-summary/?class_section_id={uuid}&month={2026-03}**
Returns: per-student attendance % for the month (for teacher/admin view)

### 8.3 Absence Alerts (Background Job)

- **Trigger:** Every school day at `08:30 AM` (branch local time)
- **Job:** For each class that has submitted attendance, find all `ABSENT` students
- **Action:** Send SMS to `is_primary=True` parent: `"Dear Parent, {student_name} of Class {grade}-{section} has been marked Absent today ({date}). Please contact the school if needed."`
- **Retry:** If SMS fails → retry after 30 minutes → retry after 2 hours → mark as `FAILED` in notification log
- **Constraint:** Only runs on working days (skip weekends)

---

## 9. TIMETABLE SYSTEM (BASIC)

### 9.1 Models

```python
class Period(models.Model):
    id              # UUID
    branch          # ForeignKey → Branch
    name            # CharField, max_length=50 (e.g., "Period 1", "Lunch Break")
    period_type     # CharField, choices=["CLASS","BREAK","ASSEMBLY","SPORTS"], default="CLASS"
    start_time      # TimeField, required (e.g., "08:00")
    end_time        # TimeField, required (e.g., "08:45")
    order           # PositiveIntegerField (display order)
    
    class Meta:
        ordering = ["order"]

class Subject(models.Model):
    id              # UUID
    branch          # ForeignKey → Branch
    name            # CharField, max_length=100, required (e.g., "Mathematics")
    code            # CharField, max_length=10 (e.g., "MATH")
    grade_levels    # JSONField (list of grades: ["1","2","3"])
    is_active       # BooleanField, default=True

class TimetableSlot(models.Model):
    id              # UUID
    class_section   # ForeignKey → ClassSection
    period          # ForeignKey → Period
    day_of_week     # CharField, choices=["MON","TUE","WED","THU","FRI","SAT"], required
    subject         # ForeignKey → Subject, nullable (null for BREAK)
    teacher         # ForeignKey → User (role=TEACHER), nullable
    
    class Meta:
        unique_together = ["class_section", "period", "day_of_week"]
```

**Endpoints:**
```
GET    /api/timetable/?class_section_id={uuid}    → full week timetable
POST   /api/timetable/slots/                      → create/update single slot
PUT    /api/timetable/slots/{id}/
DELETE /api/timetable/slots/{id}/
GET    /api/timetable/teacher/?teacher_id={uuid}  → teacher's full week timetable
GET    /api/timetable/periods/
POST   /api/timetable/periods/
GET    /api/subjects/
POST   /api/subjects/
```

**GET /api/timetable/?class_section_id={uuid} Response:**
```json
{
  "success": true,
  "data": {
    "class_section": { "id": "uuid", "display": "Grade 1 - A" },
    "timetable": {
      "MON": [
        { "period": { "name": "Period 1", "start_time": "08:00", "end_time": "08:45" }, "subject": "Mathematics", "teacher": "Mrs. Priya Kumar" },
        { "period": { "name": "Break", "start_time": "10:30", "end_time": "11:00" }, "subject": null, "teacher": null }
      ],
      "TUE": [...]
    }
  }
}
```

---

## 10. UI STATE DEFINITIONS (ALL SCREENS)

Every screen in the Next.js frontend MUST handle these 5 states:

| State | What to Render |
|---|---|
| `loading` | Skeleton loaders matching the page layout (NOT spinners alone) |
| `empty` | Illustration + descriptive text + primary action button |
| `error` | Error message + error code + "Try Again" button |
| `permission_denied` | Lock icon + "You don't have access to this page." + role displayed |
| `data` | Actual content |

### Examples Per Screen

**Student List:**
- loading: 3 skeleton table rows
- empty: "No students enrolled yet. [+ Add Student]"
- error: "Failed to load students. (ERROR_CODE) [Try Again]"
- permission_denied: Only SCHOOL_ADMIN, ACCOUNTANT, TEACHER with own section access

**Attendance Marking:**
- loading: Skeleton roster
- empty: "No students in this class section."
- error: "Could not load roster."
- already_submitted: Show submitted attendance with "Edit Attendance" button (creates audit entry on edit)
- permission_denied: Teachers see only own classes

**Invoice List (Parent):**
- loading: Skeleton cards
- empty: "No invoices generated yet."
- error: "Could not load fees."
- data: Invoice cards sorted by due_date ascending

---

*Continued in Part 3: Fee System, Expense Module, Notifications, Parent Portal*
