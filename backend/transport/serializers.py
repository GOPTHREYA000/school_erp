from rest_framework import serializers
from .models import TransportRoute, TransportRateSlab, StudentTransport


class TransportRouteSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = TransportRoute
        fields = [
            'id', 'tenant', 'branch', 'name', 'start_point', 'end_point',
            'distance_km', 'stops', 'is_active', 'student_count', 'created_at',
        ]
        read_only_fields = ['id', 'tenant', 'student_count', 'created_at']

    def get_student_count(self, obj):
        return obj.students.filter(is_active=True).count()


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
    route_name = serializers.CharField(source='route.name', read_only=True)
    class_section = serializers.CharField(source='student.class_section.display_name', read_only=True, default=None)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True, default=None)

    class Meta:
        model = StudentTransport
        fields = [
            'id', 'student', 'student_name', 'admission_number', 'class_section',
            'route', 'route_name', 'distance_km', 'pickup_point',
            'monthly_fee', 'is_active', 'opted_at',
        ]
        read_only_fields = ['id', 'monthly_fee', 'opted_at', 'student_name', 'route_name', 'class_section', 'admission_number']

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"


class StudentTransportOptInSerializer(serializers.Serializer):
    """Used for the opt-in endpoint."""
    student_id = serializers.UUIDField()
    route_id = serializers.UUIDField()
    distance_km = serializers.DecimalField(max_digits=6, decimal_places=2)
    pickup_point = serializers.CharField(required=False, allow_blank=True, default='')
