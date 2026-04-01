from rest_framework import serializers
from django.utils import timezone
from .models import AttendanceRecord


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = '__all__'
        read_only_fields = ['id', 'marked_at', 'tenant']

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"


class BulkAttendanceItemSerializer(serializers.Serializer):
    student_id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE'])
    remarks = serializers.CharField(required=False, allow_blank=True, default='')


class BulkAttendanceSerializer(serializers.Serializer):
    class_section_id = serializers.UUIDField()
    date = serializers.DateField()
    records = BulkAttendanceItemSerializer(many=True)

    def validate_date(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError("Cannot mark attendance for future dates.")
        if value.weekday() == 6:  # Sunday
            raise serializers.ValidationError("Cannot mark attendance on a non-working day (Sunday).")
        return value


class AttendanceSummarySerializer(serializers.Serializer):
    total_days = serializers.IntegerField()
    present_days = serializers.IntegerField()
    absent_days = serializers.IntegerField()
    late_days = serializers.IntegerField()
    half_days = serializers.IntegerField()
    attendance_percentage = serializers.FloatField()
