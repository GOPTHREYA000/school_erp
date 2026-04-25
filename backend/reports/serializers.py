from rest_framework import serializers
from .models import ExportJob

class ExportJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExportJob
        fields = ['id', 'report_type', 'status', 'file_url', 'file_format', 'created_at', 'completed_at', 'error_message']
