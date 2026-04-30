from rest_framework import serializers
from .models import DocumentTemplate

class DocumentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTemplate
        fields = [
            'id', 'tenant', 'branch', 'name', 'type', 'mode', 
            'config_data', 'raw_html', 'is_active', 'is_default',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']

    def validate(self, data):
        mode = data.get('mode')
        # Mode specific validation
        if mode == 'CONFIG' and not data.get('config_data'):
            pass # Or set default config
        if mode == 'HTML' and not data.get('raw_html'):
            raise serializers.ValidationError({"raw_html": "HTML content is required for HTML mode."})
        return data
