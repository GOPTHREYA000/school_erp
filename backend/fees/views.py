from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Q
from decimal import Decimal

from accounts.permissions import IsSchoolAdminOrAbove
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
    StudentFeeItemSerializer, FeeApprovalRequestSerializer,
)


class FeeCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = FeeCategorySerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        qs = FeeCategory.objects.filter(branch__tenant=self.request.user.tenant)
        branch = self.request.query_params.get('branch') or self.request.query_params.get('branch_id')
        if branch:
            qs = qs.filter(branch_id=branch)
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class FeeStructureViewSet(viewsets.ModelViewSet):
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        qs = FeeStructure.objects.filter(branch__tenant=self.request.user.tenant).prefetch_related('items')
        grade = self.request.query_params.get('grade')
        ay = self.request.query_params.get('academic_year_id')
        branch = self.request.query_params.get('branch') or self.request.query_params.get('branch_id')
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
        return FeeApprovalRequest.objects.filter(tenant=self.request.user.tenant)

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
        return FeeConcession.objects.filter(branch__tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class LateFeeRuleViewSet(viewsets.ModelViewSet):
    serializer_class = LateFeeRuleSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        return LateFeeRule.objects.filter(branch__tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class FeeInvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_serializer_class(self):
        if self.action == 'list':
            return FeeInvoiceListSerializer
        return FeeInvoiceSerializer

    def get_queryset(self):
        qs = FeeInvoice.objects.filter(branch__tenant=self.request.user.tenant).select_related('student')
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

        target = data['target']
        month = data['month']
        ay_id = data['academic_year_id']

        # Get target students
        if target == 'STUDENT':
            students = Student.objects.filter(id=data['student_id'], status='ACTIVE')
        elif target == 'CLASS':
            students = Student.objects.filter(class_section_id=data['class_section_id'], status='ACTIVE')
        else:  # BRANCH
            students = Student.objects.filter(
                branch__tenant=request.user.tenant, academic_year_id=ay_id, status='ACTIVE'
            )

        generated = 0
        skipped = 0
        errors = []

        for student in students:
            # Skip if invoice already exists for this student/month
            if FeeInvoice.objects.filter(student=student, month=month).exists():
                skipped += 1
                continue

            # Lookup fee structure for student's grade
            grade = student.class_section.grade if student.class_section else None
            if not grade:
                errors.append({'student_id': str(student.id), 'error': 'No class assigned'})
                continue

            structure = FeeStructure.objects.filter(
                branch=student.branch, academic_year_id=ay_id, grade=grade, is_active=True
            ).first()
            if not structure:
                errors.append({'student_id': str(student.id), 'error': 'No fee structure found'})
                continue

            # Generate invoice
            seq = FeeInvoice.objects.filter(branch=student.branch, month=month).count() + 1
            invoice_number = f"INV-{month}-{seq:04d}"

            gross = Decimal('0.00')
            items = []
            for item in structure.items.filter(is_optional=False):
                if item.frequency == 'MONTHLY' or item.frequency == 'ONE_TIME':
                    gross += item.amount
                    items.append(FeeInvoiceItem(
                        category=item.category,
                        original_amount=item.amount,
                        concession=Decimal('0.00'),
                        final_amount=item.amount,
                    ))

            # Determine due date
            year, m = month.split('-')
            due_day = 10  # Default
            from datetime import date
            due_date = date(int(year), int(m), min(due_day, 28))

            invoice = FeeInvoice.objects.create(
                tenant=request.user.tenant,
                invoice_number=invoice_number,
                student=student,
                branch=student.branch,
                academic_year_id=ay_id,
                month=month,
                gross_amount=gross,
                concession_amount=Decimal('0.00'),
                net_amount=gross,
                outstanding_amount=gross,
                due_date=due_date,
                status='SENT',
                generated_by='AUTO',
                created_by=request.user,
            )
            for item in items:
                item.invoice = invoice
            FeeInvoiceItem.objects.bulk_create(items)
            generated += 1

        return Response({
            'success': True,
            'data': {'generated': generated, 'skipped_already_exists': skipped, 'errors': errors}
        })

    @action(detail=True, methods=['patch'], url_path='cancel')
    def cancel(self, request, pk=None):
        invoice = self.get_object()
        reason = request.data.get('reason', '')
        if not reason:
            return Response({'detail': 'Cancellation reason is required.'}, status=400)
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
        invoice.status = 'WAIVED'
        invoice.cancellation_reason = reason
        invoice.save()
        return Response({'success': True, 'data': FeeInvoiceSerializer(invoice).data})

    @action(detail=False, methods=['get'], url_path='defaulters')
    def defaulters(self, request):
        aging = request.query_params.get('aging', '30')
        today = timezone.now().date()
        overdue_invoices = FeeInvoice.objects.filter(
            branch__tenant=request.user.tenant,
            status__in=['SENT', 'OVERDUE', 'PARTIALLY_PAID'],
            due_date__lt=today,
            outstanding_amount__gt=0,
        ).select_related('student', 'student__class_section')

        records = []
        for inv in overdue_invoices:
            days = (today - inv.due_date).days
            if aging == '30' and days > 30:
                continue
            elif aging == '60' and (days <= 30 or days > 60):
                continue
            elif aging == '90' and (days <= 60 or days > 90):
                continue
            elif aging == '90_plus' and days <= 90:
                continue

            records.append({
                'student_id': str(inv.student.id),
                'student_name': f"{inv.student.first_name} {inv.student.last_name}",
                'admission_number': inv.student.admission_number,
                'grade': inv.student.class_section.grade if inv.student.class_section else None,
                'outstanding_amount': str(inv.outstanding_amount),
                'overdue_since': str(inv.due_date),
                'days_overdue': days,
                'invoice_number': inv.invoice_number,
            })

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
        return Payment.objects.filter(branch__tenant=self.request.user.tenant).select_related('student', 'invoice')

    @action(detail=False, methods=['post'], url_path='offline')
    def record_offline(self, request):
        serializer = OfflinePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        invoice = FeeInvoice.objects.get(id=data['invoice_id'])
        amount = data['amount']

        # Create payment
        seq = Payment.objects.filter(branch=invoice.branch).count() + 1
        receipt_number = f"RCP-{timezone.now().strftime('%Y%m')}-{seq:04d}"

        requires_approval = amount > 500 and data['payment_mode'] != 'ONLINE'

        payment = Payment.objects.create(
            tenant=request.user.tenant,
            invoice=invoice,
            student=invoice.student,
            branch=invoice.branch,
            amount=amount,
            payment_mode=data['payment_mode'],
            payment_date=data['payment_date'],
            reference_number=data.get('reference_number'),
            bank_name=data.get('bank_name'),
            status='COMPLETED' if not requires_approval else 'PENDING',
            collected_by=request.user,
            requires_approval=requires_approval,
            receipt_number=receipt_number,
        )

        # Update invoice amounts
        if payment.status == 'COMPLETED':
            invoice.paid_amount += amount
            invoice.outstanding_amount = invoice.net_amount - invoice.paid_amount
            if invoice.outstanding_amount <= 0:
                invoice.status = 'PAID'
                invoice.outstanding_amount = Decimal('0.00')
            else:
                invoice.status = 'PARTIALLY_PAID'
            invoice.save()

        return Response({
            'success': True,
            'data': PaymentSerializer(payment).data
        }, status=status.HTTP_201_CREATED)
