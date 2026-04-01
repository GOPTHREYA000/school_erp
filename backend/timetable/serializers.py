from rest_framework import serializers
from .models import Period, Subject, TimetableSlot


class PeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Period
        fields = '__all__'
        read_only_fields = ['id', 'tenant']


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'
        read_only_fields = ['id', 'tenant']


class TimetableSlotSerializer(serializers.ModelSerializer):
    period_name = serializers.CharField(source='period.name', read_only=True)
    period_start = serializers.TimeField(source='period.start_time', read_only=True)
    period_end = serializers.TimeField(source='period.end_time', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True, default=None)
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = TimetableSlot
        fields = '__all__'
        read_only_fields = ['id', 'tenant']

    def get_teacher_name(self, obj):
        if obj.teacher:
            return f"{obj.teacher.first_name} {obj.teacher.last_name}"
        return None
