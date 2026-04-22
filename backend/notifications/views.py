from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from accounts.permissions import IsBranchAdminOrAbove
from .models import NotificationTemplate, NotificationLog
from .serializers import NotificationTemplateSerializer, NotificationLogSerializer

class NotificationTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAuthenticated, IsBranchAdminOrAbove]
    lookup_field = 'event_type'

    def get_queryset(self):
        return NotificationTemplate.objects.filter(branch__tenant=self.request.user.tenant)

class NotificationLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationLogSerializer
    permission_classes = [IsAuthenticated, IsBranchAdminOrAbove]

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


# ─── Universal In-App Notifications ────────────────────────────────
from rest_framework.decorators import api_view, permission_classes as perm_classes
from accounts.models import User

@api_view(['GET'])
@perm_classes([IsAuthenticated])
def my_notifications(request):
    """GET /api/notifications/mine/ — list in-app notifications for the logged-in user."""
    qs = NotificationLog.objects.filter(
        recipient_user=request.user,
        channel='IN_APP',
    ).order_by('-created_at')[:50]

    data = [{
        'id': str(n.id),
        'event_type': n.event_type,
        'title': n.payload.get('title', '') if n.payload else n.event_type,
        'message': n.payload.get('message', '') if n.payload else '',
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat(),
    } for n in qs]

    unread_count = NotificationLog.objects.filter(
        recipient_user=request.user, channel='IN_APP', is_read=False
    ).count()

    return Response({'data': data, 'unread_count': unread_count})


@api_view(['POST'])
@perm_classes([IsAuthenticated])
def my_mark_read(request, notification_id):
    """POST /api/notifications/mine/<id>/read/ — mark a single notification as read."""
    try:
        notif = NotificationLog.objects.get(
            id=notification_id, recipient_user=request.user, channel='IN_APP'
        )
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response({'success': True})
    except NotificationLog.DoesNotExist:
        return Response({'detail': 'Notification not found.'}, status=404)


@api_view(['POST'])
@perm_classes([IsAuthenticated])
def my_mark_all_read(request):
    """POST /api/notifications/mine/read-all/ — mark all notifications as read."""
    count = NotificationLog.objects.filter(
        recipient_user=request.user, channel='IN_APP', is_read=False
    ).update(is_read=True)

    return Response({'success': True, 'marked_count': count})


