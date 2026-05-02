from urllib.parse import urlparse

from django.conf import settings
from rest_framework import serializers
from .models import Homework, HomeworkAttachment


class HomeworkAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomeworkAttachment
        fields = '__all__'
        read_only_fields = ['id', 'uploaded_at']

    def validate_file_url(self, value: str) -> str:
        parsed = urlparse(value)
        if parsed.scheme.lower() != 'https':
            raise serializers.ValidationError('Attachment URL must use HTTPS.')
        if not parsed.netloc:
            raise serializers.ValidationError('Attachment URL must include a valid host.')
        allowed = getattr(settings, 'HOMEWORK_ATTACHMENT_ALLOWED_HOSTS', None)
        if allowed:
            host = (parsed.hostname or '').lower()
            if host not in allowed:
                raise serializers.ValidationError('Attachment URL host is not allowed.')
        return value

class HomeworkSerializer(serializers.ModelSerializer):
    attachments = HomeworkAttachmentSerializer(many=True, read_only=True)
    class_section_display = serializers.CharField(source='class_section.display_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = Homework
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'tenant']
