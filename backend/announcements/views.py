from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from accounts.permissions import IsSchoolAdminOrAbove
from .models import Announcement, AnnouncementReadReceipt
from .serializers import AnnouncementSerializer, AnnouncementReadReceiptSerializer

class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Announcement.objects.filter(branch__tenant=self.request.user.tenant)
        if self.request.user.role == 'PARENT':
            qs = qs.filter(is_published=True)
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant, created_by=self.request.user)

    @action(detail=True, methods=['patch'], url_path='publish')
    def publish(self, request, pk=None):
        ann = self.get_object()
        ann.is_published = True
        ann.published_at = timezone.now()
        ann.save()
        return Response({'success': True, 'data': AnnouncementSerializer(ann).data})

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        ann = self.get_object()
        receipt, created = AnnouncementReadReceipt.objects.get_or_create(
            announcement=ann, user=request.user
        )
        return Response({'success': True, 'data': {'read': True, 'read_at': str(receipt.read_at)}})

    @action(detail=True, methods=['get'], url_path='read-receipts')
    def read_receipts(self, request, pk=None):
        ann = self.get_object()
        receipts = ann.read_receipts.all().select_related('user')
        data = [{'user': r.user.email, 'read_at': r.read_at} for r in receipts]
        return Response({'success': True, 'data': data})
