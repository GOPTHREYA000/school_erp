from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from accounts.permissions import IsSchoolAdminOrAbove
from .models import NotificationTemplate, NotificationLog
from .serializers import NotificationTemplateSerializer, NotificationLogSerializer

class NotificationTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]
    lookup_field = 'event_type'

    def get_queryset(self):
        return NotificationTemplate.objects.filter(branch__tenant=self.request.user.tenant)

class NotificationLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationLogSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        qs = NotificationLog.objects.filter(branch__tenant=self.request.user.tenant)
        stat = self.request.query_params.get('status')
        channel = self.request.query_params.get('channel')
        if stat:
            qs = qs.filter(status=stat)
        if channel:
            qs = qs.filter(channel=channel)
        return qs

    @action(detail=True, methods=['post'], url_path='retry')
    def retry(self, request, pk=None):
        log = self.get_object()
        if log.status != 'FAILED':
            return Response({'detail': 'Only FAILED notifications can be retried.'}, status=400)
        log.status = 'QUEUED'
        log.attempts += 1
        log.save()
        return Response({'success': True, 'data': NotificationLogSerializer(log).data})
