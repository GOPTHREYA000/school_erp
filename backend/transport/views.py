from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction

from accounts.permissions import IsBranchAdminOrAbove
from accounts.utils import get_validated_branch_id, get_active_academic_year
from students.models import Student
from fees.models import FeeCategory, StudentFeeItem

from .models import TransportRoute, TransportRateSlab, StudentTransport
from .serializers import (
    TransportRouteSerializer, TransportRateSlabSerializer,
    StudentTransportSerializer, StudentTransportOptInSerializer,
)


class TransportRouteViewSet(viewsets.ModelViewSet):
    serializer_class = TransportRouteSerializer
    permission_classes = [IsAuthenticated, IsBranchAdminOrAbove]

    def get_queryset(self):
        qs = TransportRoute.objects.filter(branch__tenant=self.request.user.tenant)
        branch_id = get_validated_branch_id(
            self.request.user,
            self.request.query_params.get('branch') or self.request.query_params.get('branch_id')
        )
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class TransportRateSlabViewSet(viewsets.ModelViewSet):
    serializer_class = TransportRateSlabSerializer
    permission_classes = [IsAuthenticated, IsBranchAdminOrAbove]

    def get_queryset(self):
        qs = TransportRateSlab.objects.filter(branch__tenant=self.request.user.tenant)
        branch_id = get_validated_branch_id(
            self.request.user,
            self.request.query_params.get('branch') or self.request.query_params.get('branch_id')
        )
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class StudentTransportViewSet(viewsets.ModelViewSet):
    serializer_class = StudentTransportSerializer
    permission_classes = [IsAuthenticated, IsBranchAdminOrAbove]

    def get_queryset(self):
        qs = StudentTransport.objects.filter(
            student__tenant=self.request.user.tenant
        ).select_related('student', 'student__class_section', 'route')
        branch_id = get_validated_branch_id(
            self.request.user,
            self.request.query_params.get('branch') or self.request.query_params.get('branch_id')
        )
        if branch_id:
            qs = qs.filter(student__branch_id=branch_id)
        route_id = self.request.query_params.get('route')
        if route_id:
            qs = qs.filter(route_id=route_id)
        return qs

    @transaction.atomic
    def perform_update(self, serializer):
        st = serializer.save()
        # Recalculate monthly rate if distance changes
        monthly_rate = TransportRateSlab.get_rate_for_distance(st.student.branch, st.distance_km)
        if monthly_rate is not None:
            if st.monthly_fee != monthly_rate:
                st.monthly_fee = monthly_rate
                st.save(update_fields=['monthly_fee'])
                
            # Always ensure fee item matches current rate
            annual_transport = monthly_rate * 12
            StudentFeeItem.objects.filter(
                student=st.student,
                academic_year=st.student.academic_year,
                category__code='TRANSPORT'
            ).update(amount=annual_transport)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsBranchAdminOrAbove])
def student_transport_opt_in(request):
    """Opt a student into transport. Resolves fee from rate slabs and creates StudentFeeItem."""
    serializer = StudentTransportOptInSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    student = Student.objects.filter(
        id=data['student_id'], tenant=request.user.tenant
    ).first()
    if not student:
        return Response({'detail': 'Student not found.'}, status=404)

    route = TransportRoute.objects.filter(
        id=data['route_id'], branch=student.branch, is_active=True
    ).first()
    if not route:
        return Response({'detail': 'Transport route not found for this branch.'}, status=404)

    # Check if already opted in
    existing = StudentTransport.objects.filter(student=student, is_active=True).first()
    if existing:
        return Response({'detail': 'Student already opted into transport. Deactivate first.'}, status=400)

    # Resolve monthly rate from slabs
    monthly_rate = TransportRateSlab.get_rate_for_distance(student.branch, data['distance_km'])
    if monthly_rate is None:
        return Response({
            'detail': f"No rate slab found for {data['distance_km']} km in this branch. "
                      f"Please configure transport rate slabs first."
        }, status=400)

    with transaction.atomic():
        # Create StudentTransport record
        st = StudentTransport.objects.create(
            student=student,
            route=route,
            distance_km=data['distance_km'],
            pickup_point=data.get('pickup_point', ''),
            monthly_fee=monthly_rate,
            opted_by=request.user,
        )

        # Ensure a TRANSPORT fee category exists for this branch
        transport_cat, _ = FeeCategory.objects.get_or_create(
            branch=student.branch,
            code='TRANSPORT',
            defaults={
                'tenant': student.tenant,
                'name': 'Transport Fee',
                'description': 'Monthly school transport fee',
                'is_active': True,
                'order': 99,
            }
        )

        # Create/update the StudentFeeItem for transport
        # Annual amount = monthly_rate × 12
        annual_transport = monthly_rate * 12
        StudentFeeItem.objects.update_or_create(
            student=student,
            academic_year=student.academic_year,
            category=transport_cat,
            defaults={
                'amount': annual_transport,
                'is_locked': True,
            }
        )

    return Response({
        'success': True,
        'data': StudentTransportSerializer(st).data,
        'message': f'Student opted into transport. Monthly fee: ₹{monthly_rate}, Annual: ₹{annual_transport}'
    }, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsBranchAdminOrAbove])
def student_transport_opt_out(request):
    """Opt a student out of transport. Deactivates record and removes fee item."""
    student_id = request.data.get('student_id')
    if not student_id:
        return Response({'detail': 'student_id is required.'}, status=400)

    st = StudentTransport.objects.filter(
        student_id=student_id, is_active=True,
        student__tenant=request.user.tenant
    ).first()
    if not st:
        return Response({'detail': 'No active transport opt-in found.'}, status=404)

    with transaction.atomic():
        st.is_active = False
        st.save()

        # Remove the transport fee item
        StudentFeeItem.objects.filter(
            student_id=student_id,
            category__code='TRANSPORT',
            academic_year=st.student.academic_year,
        ).delete()

    return Response({'success': True, 'message': 'Student opted out of transport.'})
