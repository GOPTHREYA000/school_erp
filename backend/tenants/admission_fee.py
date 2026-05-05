"""Branch-level admission (application) fee — separate from grade fee structures."""
from decimal import Decimal

def get_configured_admission_fee(branch_id, academic_year_id) -> Decimal:
    from .models import BranchAdmissionFee

    row = BranchAdmissionFee.objects.filter(
        branch_id=branch_id, academic_year_id=academic_year_id
    ).first()
    return row.amount if row else Decimal('0.00')


def student_requires_admission_payment(student) -> bool:
    """True if branch/year has a positive configured fee and admission is not yet paid (ADM-* invoice PAID)."""
    from fees.models import FeeInvoice

    amt = get_configured_admission_fee(student.branch_id, student.academic_year_id)
    if amt <= 0:
        return False
    paid = FeeInvoice.objects.filter(
        student=student,
        invoice_number__startswith='ADM-',
        status='PAID',
    ).exists()
    return not paid
