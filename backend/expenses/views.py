from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum
from decimal import Decimal

from accounts.permissions import IsSchoolAdminOrAbove
from .models import ExpenseCategory, Vendor, Expense, TransactionLog
from .serializers import ExpenseCategorySerializer, VendorSerializer, ExpenseSerializer, TransactionLogSerializer


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        return ExpenseCategory.objects.filter(branch__tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class VendorViewSet(viewsets.ModelViewSet):
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        return Vendor.objects.filter(branch__tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        qs = Expense.objects.filter(branch__tenant=self.request.user.tenant).select_related('category', 'vendor')
        stat = self.request.query_params.get('status')
        if stat:
            qs = qs.filter(status=stat)
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant, submitted_by=self.request.user)

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        expense = self.get_object()
        new_status = request.data.get('status')
        VALID = {'DRAFT': ['SUBMITTED'], 'SUBMITTED': ['APPROVED', 'REJECTED']}
        allowed = VALID.get(expense.status, [])
        if new_status not in allowed:
            return Response({'detail': f'Cannot transition from {expense.status} to {new_status}'}, status=400)

        expense.status = new_status
        if new_status == 'SUBMITTED' and expense.amount < 5000:
            expense.status = 'APPROVED'
            expense.approved_at = timezone.now()
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
        return Response({'success': True, 'data': ExpenseSerializer(expense).data})

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
        start = self.request.query_params.get('start_date')
        end = self.request.query_params.get('end_date')
        if start:
            qs = qs.filter(transaction_date__gte=start)
        if end:
            qs = qs.filter(transaction_date__lte=end)
        return qs
