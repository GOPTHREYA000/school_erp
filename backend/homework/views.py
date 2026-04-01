from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsTeacherOrAbove
from .models import Homework, HomeworkAttachment
from .serializers import HomeworkSerializer, HomeworkAttachmentSerializer

class HomeworkViewSet(viewsets.ModelViewSet):
    serializer_class = HomeworkSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAbove]

    def get_queryset(self):
        qs = Homework.objects.filter(class_section__branch__tenant=self.request.user.tenant).select_related('class_section', 'subject')
        cs = self.request.query_params.get('class_section_id')
        if cs:
            qs = qs.filter(class_section_id=cs)
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant, posted_by=self.request.user)

    @action(detail=True, methods=['get', 'post'], url_path='attachments')
    def attachments(self, request, pk=None):
        hw = self.get_object()
        if request.method == 'GET':
            return Response({'success': True, 'data': HomeworkAttachmentSerializer(hw.attachments.all(), many=True).data})
        if hw.attachments.count() >= 5:
            return Response({'detail': 'Maximum 5 attachments per homework.'}, status=400)
        ser = HomeworkAttachmentSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save(homework=hw)
        return Response({'success': True, 'data': ser.data}, status=201)
