"""Parent Portal — scoped API endpoints per PRD §17.
All endpoints validate student belongs to authenticated parent via ParentStudentRelation."""

from django.db import models
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from django.shortcuts import get_object_or_404


class IsParent(BasePermission):
    """Only allow users with PARENT role."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'PARENT'

from students.models import Student, ParentStudentRelation
from students.serializers import StudentSerializer
from attendance.models import AttendanceRecord
from fees.models import FeeInvoice, StudentFeeItem, FeeApprovalRequest
from fees.serializers import FeeInvoiceListSerializer
from django.db.models import Sum
from homework.models import Homework
from homework.serializers import HomeworkSerializer
from announcements.models import Announcement
from announcements.serializers import AnnouncementSerializer


def get_parent_student(user, student_id):
    """Validates parent-student relationship. Returns student or raises 403."""
    relation = ParentStudentRelation.objects.filter(parent=user, student_id=student_id).first()
    if not relation:
        return None
    return relation.student


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsParent])
def parent_children(request):
    """GET /api/parent/children/ — list linked students"""
    relations = ParentStudentRelation.objects.filter(parent=request.user).select_related(
        'student', 'student__class_section', 'student__branch'
    )
    data = []
    for r in relations:
        s = r.student
        
        # Calculate Committed Fee (Proposed/Locked)
        total = StudentFeeItem.objects.filter(student=s, academic_year=s.academic_year).aggregate(total=Sum('amount'))['total']
        if not total or total <= 0:
             pending = FeeApprovalRequest.objects.filter(student=s, status='PENDING').first()
             total = pending.offered_total if pending else 0
             
        data.append({
            'id': str(s.id),
            'first_name': s.first_name,
            'last_name': s.last_name,
            'class_section': s.class_section.display_name if s.class_section else None,
            'branch_name': s.branch.name if s.branch else None,
            'enroll_no': s.admission_number,
            'committed_fee': float(total or 0),
            'photo_url': s.photo_url,
            'relation_type': r.relation_type,
        })
    return Response({'success': True, 'data': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsParent])
def parent_child_profile(request, student_id):
    student = get_parent_student(request.user, student_id)
    if not student:
        return Response({'detail': 'Permission denied'}, status=403)
    return Response({'success': True, 'data': StudentSerializer(student).data})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsParent])
def parent_child_invoices(request, student_id):
    student = get_parent_student(request.user, student_id)
    if not student:
        return Response({'detail': 'Permission denied'}, status=403)
    invoices = FeeInvoice.objects.filter(student=student).order_by('-created_at')
    return Response({'success': True, 'data': FeeInvoiceListSerializer(invoices, many=True).data})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsParent])
def parent_child_attendance(request, student_id):
    student = get_parent_student(request.user, student_id)
    if not student:
        return Response({'detail': 'Permission denied'}, status=403)
    month = request.query_params.get('month')
    qs = AttendanceRecord.objects.filter(student=student)
    if month:
        year, m = month.split('-')
        qs = qs.filter(date__year=int(year), date__month=int(m))
    data = [{'date': str(r.date), 'status': r.status} for r in qs.order_by('date')]
    return Response({'success': True, 'data': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsParent])
def parent_child_homework(request, student_id):
    student = get_parent_student(request.user, student_id)
    if not student:
        return Response({'detail': 'Permission denied'}, status=403)
    if not student.class_section:
        return Response({'success': True, 'data': []})
    hw = Homework.objects.filter(class_section=student.class_section, is_published=True).order_by('due_date')[:20]
    return Response({'success': True, 'data': HomeworkSerializer(hw, many=True).data})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsParent])
def parent_child_timetable(request, student_id):
    student = get_parent_student(request.user, student_id)
    if not student:
        return Response({'detail': 'Permission denied'}, status=403)
    if not student.class_section:
        return Response({'success': True, 'data': {'timetable': {}}})
    from timetable.models import TimetableSlot, DAY_CHOICES
    from collections import defaultdict
    slots = TimetableSlot.objects.filter(class_section=student.class_section).select_related('period', 'subject', 'teacher').order_by('period__order')
    timetable = defaultdict(list)
    for slot in slots:
        timetable[slot.day_of_week].append({
            'period': {'name': slot.period.name, 'start_time': str(slot.period.start_time), 'end_time': str(slot.period.end_time)},
            'subject': slot.subject.name if slot.subject else None,
            'teacher': f"{slot.teacher.first_name} {slot.teacher.last_name}" if slot.teacher else None,
        })
    return Response({'success': True, 'data': {'timetable': dict(timetable)}})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsParent])
def parent_announcements(request):
    relations = ParentStudentRelation.objects.filter(parent=request.user).select_related('student', 'student__class_section')
    class_ids = set()
    for r in relations:
        if r.student.class_section:
            class_ids.add(r.student.class_section_id)
    anns = Announcement.objects.filter(
        branch__tenant=request.user.tenant, is_published=True
    ).filter(
        models.Q(target_audience__in=['ALL', 'PARENTS']) | models.Q(target_classes__id__in=class_ids)
    ).distinct().order_by('-published_at')[:20]
    return Response({'success': True, 'data': AnnouncementSerializer(anns, many=True).data})
