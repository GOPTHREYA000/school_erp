from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction

from accounts.permissions import IsAccountantOrAbove
from accounts.utils import get_validated_branch_id
from students.models import Student

from .models import TransportRateSlab, StudentTransport
from .serializers import (
    TransportRateSlabSerializer,
    StudentTransportSerializer, StudentTransportOptInSerializer,
)


class TransportRateSlabViewSet(viewsets.ModelViewSet):
    serializer_class = TransportRateSlabSerializer
    permission_classes = [IsAuthenticated, IsAccountantOrAbove]

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
    permission_classes = [IsAuthenticated, IsAccountantOrAbove]

    def get_queryset(self):
        qs = StudentTransport.objects.filter(
            student__tenant=self.request.user.tenant
        ).select_related('student', 'student__class_section')
        branch_id = get_validated_branch_id(
            self.request.user,
            self.request.query_params.get('branch') or self.request.query_params.get('branch_id')
        )
        if branch_id:
            qs = qs.filter(student__branch_id=branch_id)
        return qs

    @transaction.atomic
    def perform_update(self, serializer):
        """On distance change, just recalculate the monthly_fee on the subscription record.
        The invoice generator picks up the current monthly_fee at billing time."""
        st = serializer.save()
        monthly_rate = TransportRateSlab.get_rate_for_distance(st.student.branch, st.distance_km)
        if monthly_rate is not None and st.monthly_fee != monthly_rate:
            st.monthly_fee = monthly_rate
            st.save(update_fields=['monthly_fee'])


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAccountantOrAbove])
def student_transport_opt_in(request):
    """Opt a student into transport based on distance.
    
    Creates a StudentTransport subscription record. The monthly fee is resolved
    from the branch's distance-based rate slabs. No StudentFeeItem is created;
    the invoice generator dynamically injects the transport line item each month.
    """
    serializer = StudentTransportOptInSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    student = Student.objects.filter(
        id=data['student_id'], tenant=request.user.tenant
    ).first()
    if not student:
        return Response({'detail': 'Student not found.'}, status=404)

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
        st = StudentTransport.objects.create(
            student=student,
            distance_km=data['distance_km'],
            pickup_point=data.get('pickup_point', ''),
            monthly_fee=monthly_rate,
            opted_by=request.user,
        )

    return Response({
        'success': True,
        'data': StudentTransportSerializer(st).data,
        'message': f'Student opted into transport. Monthly fee: ₹{monthly_rate}'
    }, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAccountantOrAbove])
def student_transport_opt_out(request):
    """Opt a student out of transport.
    
    Simply deactivates the StudentTransport record. Future invoices will no
    longer include a transport line item. No financial records are deleted.
    """
    student_id = request.data.get('student_id')
    if not student_id:
        return Response({'detail': 'student_id is required.'}, status=400)

    st = StudentTransport.objects.filter(
        student_id=student_id, is_active=True,
        student__tenant=request.user.tenant
    ).first()
    if not st:
        return Response({'detail': 'No active transport opt-in found.'}, status=404)

    st.is_active = False
    st.save(update_fields=['is_active'])

    return Response({'success': True, 'message': 'Student opted out of transport. Future invoices will not include transport fees.'})
