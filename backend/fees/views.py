from datetime import date, timedelta
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction, models
from django.db.models import Sum, Q, F, ExpressionWrapper
from decimal import Decimal

logger = logging.getLogger(__name__)

from accounts.permissions import IsSchoolAdminOrAbove
from accounts.utils import get_validated_branch_id, get_active_academic_year, log_audit_action
from students.models import Student, ClassSection
from .models import (
    FeeCategory, FeeStructure, FeeStructureItem, StudentWallet,
    FeeConcession, StudentConcession, LateFeeRule,
    FeeInvoice, FeeInvoiceItem, Payment,
    StudentFeeItem, FeeApprovalRequest,
)
from .serializers import (
    FeeCategorySerializer, FeeStructureSerializer, FeeStructureItemSerializer,
    FeeConcessionSerializer, StudentConcessionSerializer,
    LateFeeRuleSerializer, FeeInvoiceSerializer, FeeInvoiceListSerializer,
    PaymentSerializer, InvoiceGenerateSerializer, OfflinePaymentSerializer,
    StudentFeeItemSerializer, FeeApprovalRequestSerializer, InitialPaymentSerializer,
)
from .services import process_initial_payment


class FeeCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = FeeCategorySerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        qs = FeeCategory.objects.filter(branch__tenant=self.request.user.tenant)
        branch_id = get_validated_branch_id(self.request.user, self.request.query_params.get('branch') or self.request.query_params.get('branch_id'))
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class FeeStructureViewSet(viewsets.ModelViewSet):
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})

    def get_queryset(self):
        user = self.request.user
        qs = FeeStructure.objects.filter(branch__tenant=user.tenant).prefetch_related('items')
        
        grade = self.request.query_params.get('grade')
        ay = self.request.query_params.get('academic_year_id')
        branch = self.request.query_params.get('branch') or self.request.query_params.get('branch_id')
        
        # Branch Isolation for multi-tenant roles
        if user.role not in ['SUPER_ADMIN', 'SCHOOL_ADMIN'] and user.branch:
            branch = user.branch.id

        if grade:
            qs = qs.filter(grade=grade)
        if ay:
            qs = qs.filter(academic_year_id=ay)
        if branch:
            qs = qs.filter(branch_id=branch)
            
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant, created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='items')
    def add_item(self, request, pk=None):
        structure = self.get_object()
        serializer = FeeStructureItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(structure=structure)
        return Response({'success': True, 'data': serializer.data}, status=status.HTTP_201_CREATED)


class FeeStructureItemViewSet(viewsets.ModelViewSet):
    serializer_class = FeeStructureItemSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        return FeeStructureItem.objects.filter(structure__branch__tenant=self.request.user.tenant)


class StudentFeeItemViewSet(viewsets.ModelViewSet):
    serializer_class = StudentFeeItemSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        return StudentFeeItem.objects.filter(student__branch__tenant=self.request.user.tenant)


class FeeApprovalRequestViewSet(viewsets.ModelViewSet):
    serializer_class = FeeApprovalRequestSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        user = self.request.user
        qs = FeeApprovalRequest.objects.filter(tenant=user.tenant)
        branch_id = get_validated_branch_id(user, self.request.query_params.get('branch_id'))
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        stat = self.request.query_params.get('status')
        if stat:
            qs = qs.filter(status=stat)
        return qs

    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.user.tenant,
            requested_by=self.request.user
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        approval = self.get_object()
        approval.status = 'APPROVED'
        approval.reviewed_by = request.user
        approval.reviewed_at = timezone.now()
        approval.admin_remarks = request.data.get('remarks', '')
        approval.save()
        
        # After approval, update student status
        student = approval.student
        student.status = 'ACTIVE'
        student.save()
        
        return Response({'success': True, 'message': 'Fee reduction approved.'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        approval = self.get_object()
        approval.status = 'REJECTED'
        approval.reviewed_by = request.user
        approval.reviewed_at = timezone.now()
        approval.admin_remarks = request.data.get('remarks', '')
        approval.save()
        
        return Response({'success': True, 'message': 'Fee reduction rejected.'})


class FeeConcessionViewSet(viewsets.ModelViewSet):
    serializer_class = FeeConcessionSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPER_ADMIN':
            return FeeConcession.objects.all()
        return FeeConcession.objects.filter(branch__tenant=user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class LateFeeRuleViewSet(viewsets.ModelViewSet):
    serializer_class = LateFeeRuleSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPER_ADMIN':
            return LateFeeRule.objects.all()
        return LateFeeRule.objects.filter(branch__tenant=user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class FeeInvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_serializer_class(self):
        if self.action == 'list':
            return FeeInvoiceListSerializer
        return FeeInvoiceSerializer

    def get_queryset(self):
        user = self.request.user
        qs = FeeInvoice.objects.filter(branch__tenant=user.tenant).select_related('student')
        # Branch isolation
        branch_id = get_validated_branch_id(user, self.request.query_params.get('branch_id'))
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        status_filter = self.request.query_params.get('status')
        student = self.request.query_params.get('student_id')
        month = self.request.query_params.get('month')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if student:
            qs = qs.filter(student_id=student)
        if month:
            qs = qs.filter(month=month)
        return qs

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        serializer = InvoiceGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        from .services import generate_monthly_invoices
        
        # SCHOOL_ADMIN has branch=None; accept branch_id from request data
        branch = request.user.branch
        if not branch and data.get('branch_id'):
            from tenants.models import Branch
            try:
                branch = Branch.objects.get(id=data['branch_id'], tenant=request.user.tenant)
            except Branch.DoesNotExist:
                return Response({'detail': 'Invalid branch_id.'}, status=400)
        
        if not branch:
            return Response({'detail': 'branch_id is required for school-level admins.'}, status=400)

        result = generate_monthly_invoices(
            tenant=request.user.tenant,
            branch=branch,
            academic_year_id=data['academic_year_id'],
            month=data['month'],
            target=data['target'],
            class_section_id=data.get('class_section_id'),
            student_id=data.get('student_id'),
            user=request.user
        )

        return Response({
            'success': True,
            'data': result
        })

    @action(detail=True, methods=['patch'], url_path='cancel')
    def cancel(self, request, pk=None):
        invoice = self.get_object()
        reason = request.data.get('reason', '')
        if not reason:
            return Response({'detail': 'Cancellation reason is required.'}, status=400)
        if invoice.status in ['PAID', 'CANCELLED']:
            return Response({'detail': f'Cannot cancel a {invoice.status} invoice.'}, status=400)
        if invoice.paid_amount > 0:
            return Response({'detail': 'Cannot cancel an invoice with recorded payments. Reverse payments first.'}, status=400)
        invoice.status = 'CANCELLED'
        invoice.cancelled_by = request.user
        invoice.cancellation_reason = reason
        invoice.save()
        return Response({'success': True, 'data': FeeInvoiceSerializer(invoice).data})

    @action(detail=True, methods=['patch'], url_path='waive')
    def waive(self, request, pk=None):
        invoice = self.get_object()
        reason = request.data.get('reason', '')
        if not reason:
            return Response({'detail': 'Waive reason is required.'}, status=400)
        if invoice.status in ['PAID', 'CANCELLED', 'WAIVED']:
            return Response({'detail': f'Cannot waive a {invoice.status} invoice.'}, status=400)
        invoice.status = 'WAIVED'
        invoice.outstanding_amount = Decimal('0.00')
        invoice.cancellation_reason = reason
        invoice.save()
        return Response({'success': True, 'data': FeeInvoiceSerializer(invoice).data})

    @action(detail=False, methods=['post'], url_path='bulk-remind')
    def bulk_remind(self, request):
        """Send fee reminders to selected invoices."""
        invoice_ids = request.data.get('invoice_ids', [])
        if not invoice_ids:
            return Response({'detail': 'No invoices selected.'}, status=400)

        invoices = FeeInvoice.objects.filter(
            id__in=invoice_ids,
            branch__tenant=request.user.tenant,
            status__in=['SENT', 'OVERDUE', 'PARTIALLY_PAID']
        ).select_related('student')

        reminded = 0
        for inv in invoices:
            # TODO: Integrate with notification system (SMS/WhatsApp/Email)
            reminded += 1
            logger.info(f"Fee reminder queued for {inv.student.first_name} {inv.student.last_name} - Invoice {inv.invoice_number}")

        return Response({
            'success': True,
            'data': {
                'reminded': reminded,
                'message': f'{reminded} reminder(s) queued successfully.'
            }
        })

    @action(detail=False, methods=['get'], url_path='defaulters')
    def defaulters(self, request):
        aging = request.query_params.get('aging', '30')
        today = timezone.now().date()
        
        # 1. Calculate Date Thresholds
        filters = Q(branch__tenant=request.user.tenant) & Q(status__in=['SENT', 'OVERDUE', 'PARTIALLY_PAID']) & Q(outstanding_amount__gt=0)
        
        if aging == '30':
            filters &= Q(due_date__gte=today - timedelta(days=30), due_date__lt=today)
        elif aging == '60':
            filters &= Q(due_date__gte=today - timedelta(days=60), due_date__lt=today - timedelta(days=30))
        elif aging == '90':
            filters &= Q(due_date__gte=today - timedelta(days=90), due_date__lt=today - timedelta(days=60))
        elif aging == '90_plus':
            filters &= Q(due_date__lt=today - timedelta(days=90))
        else:
            filters &= Q(due_date__lt=today) # Default: all overdue
            
        overdue_invoices = list(FeeInvoice.objects.filter(filters).values(
            'student__id',
            'student__first_name',
            'student__last_name',
            'student__admission_number',
            'student__class_section__grade',
            'outstanding_amount',
            'due_date',
            'invoice_number'
        ).order_by('due_date'))

        # 2. Map results (Highly efficient without object instantiation)
        records = [{
            'student_id': str(inv['student__id']),
            'student_name': f"{inv['student__first_name']} {inv['student__last_name']}",
            'admission_number': inv['student__admission_number'],
            'grade': inv['student__class_section__grade'],
            'outstanding_amount': str(inv['outstanding_amount']),
            'overdue_since': str(inv['due_date']),
            'days_overdue': (today - inv['due_date']).days,
            'invoice_number': inv['invoice_number'],
        } for inv in overdue_invoices]

        total_outstanding = sum(Decimal(r['outstanding_amount']) for r in records)
        return Response({
            'success': True,
            'data': {
                'summary': {'total_students': len(records), 'total_outstanding': str(total_outstanding)},
                'records': records,
            }
        })


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        qs = Payment.objects.filter(branch__tenant=self.request.user.tenant).select_related('student', 'invoice')
        branch_id = get_validated_branch_id(self.request.user, self.request.query_params.get('branch_id'))
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        return qs

    @transaction.atomic
    @action(detail=False, methods=['post'], url_path='offline')
    def record_offline(self, request):
        serializer = OfflinePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Lock the invoice row to prevent concurrent payment race conditions
        try:
            invoice = FeeInvoice.objects.select_for_update().get(id=data['invoice_id'])
        except FeeInvoice.DoesNotExist:
            return Response({'detail': 'Invoice not found.'}, status=404)

        amount = data['amount']

        # Validate invoice is payable
        if invoice.status in ['PAID', 'CANCELLED', 'WAIVED']:
            return Response({
                'detail': f'Cannot pay a {invoice.status} invoice.'
            }, status=400)

        # Validate amount doesn't exceed outstanding
        if amount > invoice.outstanding_amount:
            return Response({
                'detail': f'Amount exceeds outstanding balance of ₹{invoice.outstanding_amount}'
            }, status=400)

        # Create payment safely
        from .models import DocumentSequence
        receipt_number = DocumentSequence.get_next_sequence(
            branch=invoice.branch,
            document_type='RECEIPT',
            prefix=f"RCP-{timezone.now().strftime('%Y%m')}"
        )

        payment = Payment.objects.create(
            tenant=invoice.tenant,
            invoice=invoice,
            student=invoice.student,
            branch=invoice.branch,
            amount=amount,
            payment_mode=data['payment_mode'],
            payment_date=data['payment_date'],
            reference_number=data.get('reference_number'),
            bank_name=data.get('bank_name'),
            status='COMPLETED',
            collected_by=request.user,
            requires_approval=False,
            receipt_number=receipt_number,
        )

        # Update invoice amounts — safe because row is locked
        if payment.status == 'COMPLETED':
            invoice.paid_amount += amount
            invoice.outstanding_amount = max(invoice.net_amount - invoice.paid_amount, Decimal('0.00'))
            if invoice.outstanding_amount <= 0:
                invoice.status = 'PAID'
                invoice.outstanding_amount = Decimal('0.00')
            else:
                invoice.status = 'PARTIALLY_PAID'
            invoice.save()

            # Create TransactionLog INCOME entry — NO try/except!
            # If this fails, @transaction.atomic rolls back the payment too,
            # guaranteeing ledger consistency.
            from expenses.models import TransactionLog
            TransactionLog.objects.create(
                tenant=invoice.tenant,
                branch=invoice.branch,
                transaction_type='INCOME',
                category='Fee Payment',
                reference_model='Payment',
                reference_id=payment.id,
                amount=amount,
                description=f"Payment for {invoice.invoice_number}",
                transaction_date=data['payment_date'],
            )

            log_audit_action(
                user=request.user,
                action='CREATE_OFFLINE_PAYMENT',
                model_name='Payment',
                record_id=payment.id,
                details={
                    'invoice_number': invoice.invoice_number,
                    'amount': float(amount),
                    'receipt_number': receipt_number
                }
            )

        return Response({
            'success': True,
            'data': PaymentSerializer(payment).data
        }, status=status.HTTP_201_CREATED)

    @transaction.atomic
    @action(detail=False, methods=['post'], url_path='initial-payment')
    def initial_payment(self, request):
        serializer = InitialPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        student = Student.objects.get(id=data['student_id'])
        
        result = process_initial_payment(
            user=request.user,
            student=student,
            admission_fee=data['admission_fee'],
            tuition_payment=data['tuition_payment'],
            payment_mode=data['payment_mode'],
            payment_date=data['payment_date'],
            reference_number=data.get('reference_number')
        )
        
        return Response({'success': True, 'data': result}, status=status.HTTP_201_CREATED)

    @transaction.atomic
    @action(detail=True, methods=['post'], url_path='reverse')
    def reverse_payment(self, request, pk=None):
        """Reverse a completed payment — updates invoice and creates negative ledger entry."""
        reason = request.data.get('reason', '')
        if not reason:
            return Response({'detail': 'Reversal reason is required.'}, status=400)

        try:
            payment = Payment.objects.select_for_update().get(id=pk)
        except Payment.DoesNotExist:
            return Response({'detail': 'Payment not found.'}, status=404)

        if payment.status != 'COMPLETED':
            return Response({'detail': f'Only completed payments can be reversed. Current status: {payment.status}'}, status=400)

        # Lock and update the invoice
        invoice = FeeInvoice.objects.select_for_update().get(id=payment.invoice_id)

        invoice.paid_amount = max(invoice.paid_amount - payment.amount, Decimal('0.00'))
        invoice.outstanding_amount = invoice.net_amount - invoice.paid_amount
        if invoice.paid_amount > 0:
            invoice.status = 'PARTIALLY_PAID'
        else:
            invoice.status = 'SENT'
        invoice.save()

        # Mark payment as refunded
        payment.status = 'REFUNDED'
        payment.save()

        # Create a negative ledger entry for the reversal
        from expenses.models import TransactionLog
        TransactionLog.objects.create(
            tenant=payment.tenant,
            branch=payment.branch,
            transaction_type='INCOME',
            category='Fee Reversal',
            reference_model='Payment',
            reference_id=payment.id,
            amount=-payment.amount,  # Negative entry
            description=f"Reversal: {reason} (Receipt: {payment.receipt_number})",
            transaction_date=timezone.now().date(),
        )

        log_audit_action(
            user=request.user,
            action='REVERSE_PAYMENT',
            model_name='Payment',
            record_id=payment.id,
            details={
                'reason': reason,
                'amount': float(payment.amount),
                'receipt_number': payment.receipt_number,
                'invoice_number': invoice.invoice_number
            }
        )

        logger.info(f"Payment {payment.receipt_number} reversed by {request.user.email}. Reason: {reason}")

        return Response({
            'success': True, 
            'message': f'Payment {payment.receipt_number} reversed successfully.',
            'data': PaymentSerializer(payment).data
        })
