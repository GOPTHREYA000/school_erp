from rest_framework import serializers
from .models import TransportRateSlab, StudentTransport


class TransportRateSlabSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportRateSlab
        fields = [
            'id', 'tenant', 'branch', 'min_km', 'max_km',
            'monthly_rate', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'tenant', 'created_at']


class StudentTransportSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    class_section = serializers.CharField(source='student.class_section.display_name', read_only=True, default=None)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True, default=None)

    class Meta:
        model = StudentTransport
        fields = [
            'id', 'student', 'student_name', 'admission_number', 'class_section',
            'distance_km', 'pickup_point', 'monthly_fee', 'is_active', 'opted_at',
        ]
        read_only_fields = ['id', 'monthly_fee', 'opted_at', 'student_name', 'class_section', 'admission_number']

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"


class StudentTransportOptInSerializer(serializers.Serializer):
    """Used for the opt-in endpoint."""
    student_id = serializers.UUIDField()
    distance_km = serializers.DecimalField(max_digits=6, decimal_places=2)
    pickup_point = serializers.CharField(required=False, allow_blank=True, default='')
