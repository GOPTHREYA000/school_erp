from django.db import models
from django.db.models import Sum, DecimalField
from django.db.models.functions import Coalesce
from fees.models import FeeInvoice, Payment, StudentConcession
from expenses.models import Expense, TransactionLog
from reports.services.base import BaseReportService
from decimal import Decimal

class PaymentsService:
    @staticmethod
    def get_fee_balances(filters):
        qs = FeeInvoice.objects.select_related('student', 'student__class_section').filter(outstanding_amount__gt=0).exclude(status='CANCELLED')
        qs = BaseReportService.apply_branch_scope(qs, filters)
        qs = BaseReportService.apply_academic_year(qs, filters.academic_year_id)
        
        if filters.class_id:
            qs = qs.filter(student__class_section__grade=filters.class_id)
        if filters.section_id:
            qs = qs.filter(student__class_section_id=filters.section_id)
            
        return qs.order_by('-due_date')

    @staticmethod
    def get_daily_collections(filters):
        qs = Payment.objects.select_related('student', 'invoice').filter(status='COMPLETED')
        qs = BaseReportService.apply_branch_scope(qs, filters)
        qs = BaseReportService.apply_date_range(qs, 'payment_date', filters.start_date, filters.end_date)
        return qs.order_by('-payment_date')

    @staticmethod
    def get_receipts(filters, is_deleted=False):
        qs = Payment.objects.select_related('student', 'invoice').filter(receipt_number__isnull=False)
        qs = BaseReportService.apply_branch_scope(qs, filters)
        qs = BaseReportService.apply_date_range(qs, 'payment_date', filters.start_date, filters.end_date)
        
        if is_deleted:
            qs = qs.filter(status='REFUNDED')
        else:
            qs = qs.exclude(status='REFUNDED')
            
        return qs.order_by('-payment_date')

    @staticmethod
    def get_concessions(filters):
        qs = StudentConcession.objects.select_related('student', 'concession', 'approved_by')
        
        # Branch scope needs to go through student
        qs = qs.filter(student__tenant=filters.user.tenant)
        if filters.branch_id:
            qs = qs.filter(student__branch_id=filters.branch_id)
            
        qs = BaseReportService.apply_date_range(qs, 'approved_at__date', filters.start_date, filters.end_date)
        
        if filters.status:
            qs = qs.filter(status=filters.status)
            
        return qs.order_by('-valid_from')

    @staticmethod
    def get_fees_paid_by_mode(filters):
        qs = Payment.objects.filter(status='COMPLETED')
        qs = BaseReportService.apply_branch_scope(qs, filters)
        qs = BaseReportService.apply_date_range(qs, 'payment_date', filters.start_date, filters.end_date)
        
        return qs.values('payment_mode').annotate(total=Sum('amount')).order_by('payment_mode')

    @staticmethod
    def get_bank_transactions(filters):
        qs = Payment.objects.select_related('student').filter(
            status='COMPLETED', 
            payment_mode__in=['CHEQUE', 'NEFT', 'RTGS', 'DD', 'UPI']
        )
        qs = BaseReportService.apply_branch_scope(qs, filters)
        qs = BaseReportService.apply_date_range(qs, 'payment_date', filters.start_date, filters.end_date)
        
        return qs.order_by('-payment_date')

    @staticmethod
    def get_income_statement(filters):
        qs = TransactionLog.objects.filter(transaction_type='INCOME')
        qs = BaseReportService.apply_branch_scope(qs, filters)
        qs = BaseReportService.apply_date_range(qs, 'transaction_date', filters.start_date, filters.end_date)
        
        return qs.values('category').annotate(total=Sum('amount')).order_by('-total')

    @staticmethod
    def get_expenses(filters):
        qs = Expense.objects.select_related('category', 'vendor')
        qs = BaseReportService.apply_branch_scope(qs, filters)
        qs = BaseReportService.apply_date_range(qs, 'expense_date', filters.start_date, filters.end_date)
        
        if filters.status:
            qs = qs.filter(status=filters.status)
            
        return qs.order_by('-expense_date')

    @staticmethod
    def get_income_vs_expenses(filters):
        qs = TransactionLog.objects.all()
        qs = BaseReportService.apply_branch_scope(qs, filters)
        qs = BaseReportService.apply_date_range(qs, 'transaction_date', filters.start_date, filters.end_date)
        
        stats = qs.aggregate(
            total_income=Coalesce(Sum('amount', filter=models.Q(transaction_type='INCOME')), Decimal('0.00'), output_field=DecimalField()),
            total_expense=Coalesce(Sum('amount', filter=models.Q(transaction_type='EXPENSE')), Decimal('0.00'), output_field=DecimalField())
        )
        return stats

    @staticmethod
    def get_mismatch_detection(filters):
        qs = FeeInvoice.objects.exclude(status='CANCELLED')
        qs = BaseReportService.apply_branch_scope(qs, filters)
        qs = BaseReportService.apply_academic_year(qs, filters.academic_year_id)
        
        drifts = []
        # In a real system, we might want to do this via annotation, but keeping it simple as per original
        for inv in qs.iterator():
            payment_sum = Payment.objects.filter(
                invoice=inv, status='COMPLETED'
            ).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
            
            if inv.paid_amount != payment_sum:
                drifts.append({
                    'invoice_number': inv.invoice_number,
                    'student_name': f"{inv.student.first_name} {inv.student.last_name}",
                    'invoice_paid': float(inv.paid_amount),
                    'payment_sum': float(payment_sum),
                    'delta': float(inv.paid_amount - payment_sum),
                })
                
        return drifts
