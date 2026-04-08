from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum
from decimal import Decimal

from accounts.permissions import IsSchoolAdminOrAbove
from accounts.utils import get_validated_branch_id, log_audit_action, log_bulk_action
from .models import ExpenseCategory, Vendor, Expense, TransactionLog
from .serializers import ExpenseCategorySerializer, VendorSerializer, ExpenseSerializer, TransactionLogSerializer


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        qs = ExpenseCategory.objects.filter(branch__tenant=self.request.user.tenant)
        branch_id = get_validated_branch_id(self.request.user, self.request.query_params.get('branch_id'))
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class VendorViewSet(viewsets.ModelViewSet):
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        qs = Vendor.objects.filter(branch__tenant=self.request.user.tenant)
        branch_id = get_validated_branch_id(self.request.user, self.request.query_params.get('branch_id'))
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        qs = Expense.objects.filter(branch__tenant=self.request.user.tenant).select_related('category', 'vendor')
        branch_id = get_validated_branch_id(self.request.user, self.request.query_params.get('branch_id'))
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        stat = self.request.query_params.get('status')
        if stat:
            qs = qs.filter(status=stat)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        branch = user.branch
        if not branch:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"branch": "Your account has no branch assigned. Contact your administrator."})
            
        expense_date = timezone.now().date()
        
        category_id = self.request.data.get('category')
        if not category_id:
            category, _ = ExpenseCategory.objects.get_or_create(
                tenant=user.tenant, 
                branch=branch, 
                name='General',
                defaults={'code': 'GEN'}
            )
        else:
            category = ExpenseCategory.objects.get(id=category_id)

        # Refined Workflow: Default to SUBMITTED for all expenses
        status = 'SUBMITTED'
        expense = serializer.save(
            tenant=user.tenant,
            branch=branch,
            expense_date=expense_date,
            category=category,
            submitted_by=user,
            status=status
        )

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        expense = self.get_object()
        new_status = request.data.get('status')
        
        # Only School Admin or Super Admin can approve
        if new_status == 'APPROVED' and request.user.role not in ['SCHOOL_ADMIN', 'SUPER_ADMIN']:
            return Response({'detail': 'Only School Admin or Super Admin can approve expenses'}, status=403)

        VALID = {'DRAFT': ['SUBMITTED'], 'SUBMITTED': ['APPROVED', 'REJECTED'], 'REJECTED': ['DRAFT']}
        allowed = VALID.get(expense.status, [])
        if new_status not in allowed:
            return Response({'detail': f'Cannot transition from {expense.status} to {new_status}'}, status=400)

        expense.status = new_status
        if new_status == 'APPROVED':
            expense.approved_by = request.user
            expense.approved_at = timezone.now()
            TransactionLog.objects.create(
                tenant=expense.tenant, branch=expense.branch,
                transaction_type='EXPENSE', category=expense.category.name,
                reference_model='Expense', reference_id=expense.id,
                amount=expense.amount, description=expense.title,
                transaction_date=expense.expense_date,
            )
        if new_status == 'REJECTED':
            expense.rejection_reason = request.data.get('reason', '')
        expense.save()

        log_audit_action(
            user=request.user,
            action=f'EXPENSE_{new_status}',
            model_name='Expense',
            record_id=expense.id,
            details={
                'title': expense.title,
                'amount': float(expense.amount),
                'status': new_status
            }
        )
        return Response({'success': True, 'data': ExpenseSerializer(expense).data})

    @action(detail=False, methods=['post'], url_path='bulk-approve')
    def bulk_approve(self, request):
        if request.user.role not in ['SCHOOL_ADMIN', 'SUPER_ADMIN']:
            return Response({'detail': 'Only School Admin or Super Admin can approve expenses'}, status=403)
            
        expense_ids = request.data.get('expense_ids', [])
        if not expense_ids:
            return Response({'detail': 'No expenses selected.'}, status=400)

        expenses = Expense.objects.filter(
            id__in=expense_ids,
            branch__tenant=request.user.tenant,
            status='SUBMITTED'
        ).select_related('category')

        approved_count = 0
        from django.db import transaction
        
        with transaction.atomic():
            for expense in expenses:
                expense.status = 'APPROVED'
                expense.approved_by = request.user
                expense.approved_at = timezone.now()
                expense.save()
                
                TransactionLog.objects.create(
                    tenant=expense.tenant, branch=expense.branch,
                    transaction_type='EXPENSE', category=expense.category.name,
                    reference_model='Expense', reference_id=expense.id,
                    amount=expense.amount, description=expense.title,
                    transaction_date=expense.expense_date,
                )
                approved_count += 1

            if approved_count > 0:
                log_bulk_action(
                    user=request.user,
                    action_type='EXPENSE_APPROVAL',
                    record_count=approved_count,
                    details={'expense_ids': expense_ids}
                )
                
        return Response({
            'success': True,
            'data': {
                'approved': approved_count,
                'message': f'{approved_count} expense(s) approved successfully.'
            }
        })

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        month = request.query_params.get('month')
        if not month:
            return Response({'detail': 'month is required (YYYY-MM)'}, status=400)
        year, m = month.split('-')
        approved = Expense.objects.filter(
            branch__tenant=request.user.tenant, status='APPROVED',
            expense_date__year=int(year), expense_date__month=int(m)
        )
        total = approved.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        by_cat = approved.values('category__name').annotate(amount=Sum('amount')).order_by('-amount')
        cats = [{'category': c['category__name'], 'amount': str(c['amount']),
                 'percentage': round(float(c['amount']) / float(total) * 100, 1) if total > 0 else 0}
                for c in by_cat]
        pending = Expense.objects.filter(
            branch__tenant=request.user.tenant, status__in=['DRAFT', 'SUBMITTED'],
            expense_date__year=int(year), expense_date__month=int(m)
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        return Response({'success': True, 'data': {
            'month': month, 'total_approved': str(total), 'total_pending': str(pending), 'by_category': cats
        }})


class TransactionLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransactionLogSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        qs = TransactionLog.objects.filter(branch__tenant=self.request.user.tenant)
        branch_id = get_validated_branch_id(self.request.user, self.request.query_params.get('branch_id'))
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        start = self.request.query_params.get('start_date')
        end = self.request.query_params.get('end_date')
        if start:
            qs = qs.filter(transaction_date__gte=start)
        if end:
            qs = qs.filter(transaction_date__lte=end)
        return qs
