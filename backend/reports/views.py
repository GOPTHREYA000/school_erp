from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsSchoolAdminOrAbove
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from expenses.models import TransactionLog
from fees.models import FeeInvoice, Payment
from attendance.models import AttendanceRecord
from decimal import Decimal

class ReportingViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    @action(detail=False, methods=['get'], url_path='finance/summary')
    def finance_summary(self, request):
        """Income vs Expense summary for charts"""
        branch_id = request.query_params.get('branch_id')
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days)

        qs = TransactionLog.objects.filter(
            tenant=request.user.tenant,
            transaction_date__gte=start_date
        )
        if branch_id:
            qs = qs.filter(branch_id=branch_id)

        # Aggregate by date and type
        data = qs.values('transaction_date', 'transaction_type').annotate(
            total_amount=Sum('amount')
        ).order_by('transaction_date')

        # Format for charts: { date: 'YYYY-MM-DD', income: X, expense: Y }
        formatted = {}
        for item in data:
            date_str = item['transaction_date'].isoformat()
            if date_str not in formatted:
                formatted[date_str] = {'date': date_str, 'income': 0, 'expense': 0}
            
            if item['transaction_type'] == 'INCOME':
                formatted[date_str]['income'] = float(item['total_amount'])
            else:
                formatted[date_str]['expense'] = float(item['total_amount'])

        return Response({
            'success': True,
            'data': sorted(formatted.values(), key=lambda x: x['date'])
        })

    @action(detail=False, methods=['get'], url_path='fees/stats')
    def fee_stats(self, request):
        """Fee collection vs outstanding stats"""
        branch_id = request.query_params.get('branch_id')
        qs = FeeInvoice.objects.filter(tenant=request.user.tenant)
        if branch_id:
            qs = qs.filter(branch_id=branch_id)

        stats = qs.aggregate(
            total_gross=Sum('gross_amount'),
            total_paid=Sum('paid_amount'),
            total_outstanding=Sum('outstanding_amount'),
            count=Count('id')
        )

        return Response({
            'success': True,
            'data': {
                'total_gross': float(stats['total_gross'] or 0),
                'total_paid': float(stats['total_paid'] or 0),
                'total_outstanding': float(stats['total_outstanding'] or 0),
                'invoice_count': stats['count']
            }
        })

    @action(detail=False, methods=['get'], url_path='fees/defaulters')
    def fee_defaulters(self, request):
        """List of students with outstanding fees"""
        branch_id = request.query_params.get('branch_id')
        qs = FeeInvoice.objects.filter(
            tenant=request.user.tenant, 
            outstanding_amount__gt=0
        ).select_related('student', 'student__class_section')
        
        if branch_id:
            qs = qs.filter(branch_id=branch_id)

        data = []
        for inv in qs:
            data.append({
                'invoice_number': inv.invoice_number,
                'student_id': str(inv.student.id),
                'student_name': f"{inv.student.first_name} {inv.student.last_name}",
                'class_name': inv.student.class_section.display_name if inv.student.class_section else "N/A",
                'due_date': inv.due_date,
                'outstanding': float(inv.outstanding_amount),
                'net_amount': float(inv.net_amount)
            })

        return Response({'success': True, 'data': data})

    @action(detail=False, methods=['get'], url_path='attendance/stats')
    def attendance_stats(self, request):
        """Attendance percentage by class/grade"""
        branch_id = request.query_params.get('branch_id')
        days = int(request.query_params.get('days', 7))
        start_date = timezone.now().date() - timedelta(days=days)

        qs = AttendanceRecord.objects.filter(
            tenant=request.user.tenant,
            date__gte=start_date
        ).select_related('class_section')

        if branch_id:
            qs = qs.filter(class_section__branch_id=branch_id)

        # Aggregate
        stats = qs.values('class_section__display_name').annotate(
            total=Count('id'),
            present=Count('id', filter=Q(status='PRESENT')),
            absent=Count('id', filter=Q(status='ABSENT'))
        )

        data = []
        for s in stats:
            pct = (s['present'] / s['total'] * 100) if s['total'] > 0 else 0
            data.append({
                'class_name': s['class_section__display_name'],
                'present': s['present'],
                'absent': s['absent'],
                'total': s['total'],
                'percentage': round(pct, 2)
            })

        return Response({'success': True, 'data': data})
