from rest_framework import serializers
from .models import Homework, HomeworkAttachment

class HomeworkAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomeworkAttachment
        fields = '__all__'
        read_only_fields = ['id', 'uploaded_at']

class HomeworkSerializer(serializers.ModelSerializer):
    attachments = HomeworkAttachmentSerializer(many=True, read_only=True)
    class_section_display = serializers.CharField(source='class_section.display_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = Homework
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'tenant']
