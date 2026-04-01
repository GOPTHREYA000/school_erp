from rest_framework import serializers
from .models import Announcement, AnnouncementReadReceipt

class AnnouncementSerializer(serializers.ModelSerializer):
    read_count = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'published_at', 'tenant']

    def get_read_count(self, obj):
        return obj.read_receipts.count()

class AnnouncementReadReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnnouncementReadReceipt
        fields = '__all__'
        read_only_fields = ['id', 'read_at']
