from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from collections import defaultdict

from accounts.permissions import IsSchoolAdminOrAbove, IsTeacherOrAbove
from .models import Period, Subject, TimetableSlot, DAY_CHOICES
from .serializers import PeriodSerializer, SubjectSerializer, TimetableSlotSerializer


class PeriodViewSet(viewsets.ModelViewSet):
    serializer_class = PeriodSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        qs = Period.objects.filter(branch__tenant=self.request.user.tenant)
        branch = self.request.query_params.get('branch_id')
        if branch:
            qs = qs.filter(branch_id=branch)
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class SubjectViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        qs = Subject.objects.filter(branch__tenant=self.request.user.tenant)
        branch = self.request.query_params.get('branch_id')
        if branch:
            qs = qs.filter(branch_id=branch)
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class TimetableSlotViewSet(viewsets.ModelViewSet):
    serializer_class = TimetableSlotSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAbove]

    def get_queryset(self):
        qs = TimetableSlot.objects.filter(
            class_section__branch__tenant=self.request.user.tenant
        ).select_related('period', 'subject', 'teacher')
        cs = self.request.query_params.get('class_section_id')
        teacher = self.request.query_params.get('teacher_id')
        if cs:
            qs = qs.filter(class_section_id=cs)
        if teacher:
            qs = qs.filter(teacher_id=teacher)
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

    @action(detail=False, methods=['get'], url_path='weekly')
    def weekly_view(self, request):
        """Returns timetable grouped by day of week for a class section."""
        cs_id = request.query_params.get('class_section_id')
        if not cs_id:
            return Response({'detail': 'class_section_id is required.'}, status=400)

        slots = TimetableSlot.objects.filter(
            class_section_id=cs_id
        ).select_related('period', 'subject', 'teacher').order_by('period__order')

        timetable = defaultdict(list)
        for slot in slots:
            timetable[slot.day_of_week].append({
                'period': {
                    'name': slot.period.name,
                    'start_time': str(slot.period.start_time),
                    'end_time': str(slot.period.end_time),
                    'type': slot.period.period_type,
                },
                'subject': slot.subject.name if slot.subject else None,
                'teacher': f"{slot.teacher.first_name} {slot.teacher.last_name}" if slot.teacher else None,
            })

        # Ensure all days are present
        for day_code, _ in DAY_CHOICES:
            if day_code not in timetable:
                timetable[day_code] = []

        return Response({'success': True, 'data': {'timetable': dict(timetable)}})

    @action(detail=False, methods=['get'], url_path='teacher-view')
    def teacher_view(self, request):
        """Returns timetable for a specific teacher grouped by day."""
        teacher_id = request.query_params.get('teacher_id')
        if not teacher_id:
            return Response({'detail': 'teacher_id is required.'}, status=400)

        slots = TimetableSlot.objects.filter(
            teacher_id=teacher_id
        ).select_related('period', 'subject', 'class_section').order_by('period__order')

        timetable = defaultdict(list)
        for slot in slots:
            timetable[slot.day_of_week].append({
                'period': {
                    'name': slot.period.name,
                    'start_time': str(slot.period.start_time),
                    'end_time': str(slot.period.end_time),
                },
                'subject': slot.subject.name if slot.subject else None,
                'class_section': slot.class_section.display_name,
            })

        return Response({'success': True, 'data': {'timetable': dict(timetable)}})
