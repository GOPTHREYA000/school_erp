from rest_framework import serializers
from django.utils import timezone
from .models import (
    ClassSection, AdmissionInquiry, AdmissionApplication,
    ApplicationDocument, Student, ParentStudentRelation,
    APPLICATION_STATUS,
)


class ClassSectionSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = ClassSection
        fields = [
            'id', 'branch', 'academic_year', 'grade', 'section',
            'display_name', 'class_teacher', 'max_capacity', 'is_active', 'student_count',
        ]
        read_only_fields = ['id', 'display_name', 'student_count']

    def get_student_count(self, obj):
        return obj.students.filter(status='ACTIVE').count()


class AdmissionInquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmissionInquiry
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'tenant']

    def validate(self, data):
        # Duplicate inquiry check: same phone + grade + academic year
        branch = data.get('branch')
        phone = data.get('parent_phone')
        grade = data.get('grade_applying_for')
        ay = data.get('academic_year')
        qs = AdmissionInquiry.objects.filter(
            branch=branch, parent_phone=phone,
            grade_applying_for=grade, academic_year=ay,
        )
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError({
                'detail': 'Duplicate inquiry exists.',
                'existing_id': str(qs.first().id),
            })
        return data


class ApplicationDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationDocument
        fields = '__all__'
        read_only_fields = ['id', 'uploaded_at']


class AdmissionApplicationSerializer(serializers.ModelSerializer):
    documents = ApplicationDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = AdmissionApplication
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'reviewed_at', 'submitted_at', 'tenant']


class ApplicationStatusSerializer(serializers.Serializer):
    """Validates status transitions per PRD §7.1.2"""
    status = serializers.ChoiceField(choices=[s[0] for s in APPLICATION_STATUS])
    remarks = serializers.CharField(required=False, allow_blank=True)

    VALID_TRANSITIONS = {
        'DRAFT': ['SUBMITTED'],
        'SUBMITTED': ['UNDER_REVIEW'],
        'UNDER_REVIEW': ['APPROVED', 'REJECTED'],
        'APPROVED': ['ENROLLED'],
    }

    def validate(self, data):
        current_status = self.context.get('current_status')
        new_status = data['status']
        allowed = self.VALID_TRANSITIONS.get(current_status, [])
        if new_status not in allowed:
            raise serializers.ValidationError(
                f"Cannot transition from {current_status} to {new_status}. Allowed: {allowed}"
            )
        if new_status == 'REJECTED' and not data.get('remarks'):
            raise serializers.ValidationError("Remarks are required when rejecting an application.")
        return data


class StudentSerializer(serializers.ModelSerializer):
    class_section_display = serializers.CharField(source='class_section.display_name', read_only=True, default=None)
    
    # Extra fields for enrollment fee locking
    offered_total = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, write_only=True)
    standard_total = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, write_only=True)
    reason = serializers.CharField(required=False, write_only=True, allow_blank=True)
    proposed_fee = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'enrollment_date', 'tenant', 'proposed_fee']
        extra_kwargs = {
            'admission_number': {'required': False, 'allow_blank': True}
        }

    def get_proposed_fee(self, obj):
        from django.db.models import Sum
        return obj.fee_items.aggregate(total=Sum('amount'))['total'] or 0


class StudentListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views"""
    class_section_display = serializers.CharField(source='class_section.display_name', read_only=True, default=None)
    branch_name = serializers.CharField(source='branch.name', read_only=True, default=None)
    proposed_fee = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'admission_number', 'first_name', 'last_name', 'gender',
            'date_of_birth', 'class_section', 'class_section_display',
            'branch_name', 'status', 'photo_url', 'roll_number', 'proposed_fee',
        ]

    def get_proposed_fee(self, obj):
        from django.db.models import Sum
        # Check actual locked fee items first
        total = obj.fee_items.aggregate(total=Sum('amount'))['total']
        if total and total > 0:
            return total
        
        # If not found, check if there's a pending approval request
        from fees.models import FeeApprovalRequest
        pending = FeeApprovalRequest.objects.filter(student=obj, status='PENDING').first()
        if pending:
            return pending.offered_total
            
        return 0


class ParentStudentRelationSerializer(serializers.ModelSerializer):
    parent_email = serializers.EmailField(source='parent.email', read_only=True)
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = ParentStudentRelation
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"
