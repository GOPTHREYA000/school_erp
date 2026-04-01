from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal
from django.utils import timezone
from django.db.models import Q

from accounts.permissions import IsSchoolAdminOrAbove, IsTeacherOrAbove
from .models import (
    ClassSection, AdmissionInquiry, AdmissionApplication,
    ApplicationDocument, Student, ParentStudentRelation,
)
from .serializers import (
    ClassSectionSerializer, AdmissionInquirySerializer,
    AdmissionApplicationSerializer, ApplicationStatusSerializer,
    ApplicationDocumentSerializer, StudentSerializer,
    StudentListSerializer, ParentStudentRelationSerializer,
)
from fees.models import FeeStructure, StudentFeeItem, FeeApprovalRequest


def create_student_fees(student, offered_total, standard_total_input, reason, requested_by):
    """Shared logic for creating fees and triggering approvals"""
    from decimal import Decimal
    from fees.models import FeeStructure, FeeStructureItem, StudentFeeItem, FeeApprovalRequest
    from django.db.models import Sum

    branch = student.branch
    ay = student.academic_year
    class_section = student.class_section
    tenant = student.tenant

    # 1. Calculate REAL standard_total from FeeStructure
    standard_total = Decimal('0.00')
    structure = None
    

    if class_section:
        structure = FeeStructure.objects.filter(
            branch=student.branch, academic_year=ay, grade=class_section.grade, is_active=True
        ).first()
        

        if structure:
            standard_total = structure.items.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

    # Defensive: ensure offered is Decimal
    if offered_total is not None:
        offered_total = Decimal(str(offered_total))
    else:
        offered_total = standard_total

    # 2. Create Locked Fee Items if a structure exists
    if structure:
        # We apply the reduction proportionally to all fee items
        # Use the actual standard_total from DB for ratio
        ratio = offered_total / standard_total if standard_total > 0 else 1
        
        for item in structure.items.all():
            StudentFeeItem.objects.create(
                student=student,
                academic_year=ay,
                category=item.category,
                amount=round(item.amount * ratio, 2)
            )

    # 3. Trigger Approval if reduction detected compared to DB standard_total
    if offered_total < standard_total:
        # Update student status to PENDING_APPROVAL
        Student.objects.filter(id=student.id).update(status='PENDING_APPROVAL')
        student.refresh_from_db() 
        
        FeeApprovalRequest.objects.create(
            tenant=tenant,
            branch=branch,
            student=student,
            requested_by=requested_by,
            standard_total=standard_total,
            offered_total=offered_total,
            reason=reason
        )
        return True
    return False


class ClassSectionViewSet(viewsets.ModelViewSet):
    serializer_class = ClassSectionSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]
    filter_backends = [filters.SearchFilter]
    search_fields = ['grade', 'section', 'display_name']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPER_ADMIN':
            qs = ClassSection.objects.all()
        else:
            qs = ClassSection.objects.filter(branch__tenant=user.tenant)
            
        # Branch Isolation
        if user.role not in ['SUPER_ADMIN', 'SCHOOL_ADMIN'] and user.branch:
            qs = qs.filter(branch=user.branch)
            
        branch = self.request.query_params.get('branch_id')
        ay = self.request.query_params.get('academic_year_id')
        if branch:
            qs = qs.filter(branch_id=branch)
        if ay:
            qs = qs.filter(academic_year_id=ay)
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        section = self.get_object()
        students = Student.objects.filter(class_section=section, status='ACTIVE')
        serializer = StudentListSerializer(students, many=True)
        return Response({'success': True, 'data': serializer.data})

    @action(detail=True, methods=['post'], url_path='assign-students')
    def assign_students(self, request, pk=None):
        section = self.get_object()
        student_ids = request.data.get('student_ids', [])
        updated = Student.objects.filter(
            id__in=student_ids, branch__tenant=request.user.tenant
        ).update(class_section=section)
        return Response({'success': True, 'data': {'assigned': updated}})


class AdmissionInquiryViewSet(viewsets.ModelViewSet):
    serializer_class = AdmissionInquirySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['student_first_name', 'student_last_name', 'parent_name', 'parent_phone']

    def get_permissions(self):
        if self.action == 'create':
            return []  # Public endpoint per PRD
        return [IsAuthenticated(), IsSchoolAdminOrAbove()]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return AdmissionInquiry.objects.none()
        qs = AdmissionInquiry.objects.filter(branch__tenant=self.request.user.tenant)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        tenant = None
        if self.request.user.is_authenticated:
            tenant = self.request.user.tenant
        else:
            # For public inquiries, derive tenant from branch
            branch = serializer.validated_data.get('branch')
            if branch:
                tenant = branch.tenant
        serializer.save(tenant=tenant)

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        inquiry = self.get_object()
        new_status = request.data.get('status')
        if new_status:
            inquiry.status = new_status
            inquiry.save()
        return Response({'success': True, 'data': AdmissionInquirySerializer(inquiry).data})


class AdmissionApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = AdmissionApplicationSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'father_name']

    def get_queryset(self):
        user = self.request.user
        qs = AdmissionApplication.objects.filter(branch__tenant=user.tenant)
        
        # Branch Isolation
        if user.role not in ['SUPER_ADMIN', 'SCHOOL_ADMIN'] and user.branch:
            qs = qs.filter(branch=user.branch)
            
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        application = self.get_object()
        serializer = ApplicationStatusSerializer(
            data=request.data,
            context={'current_status': application.status}
        )
        serializer.is_valid(raise_exception=True)
        application.status = serializer.validated_data['status']
        if serializer.validated_data.get('remarks'):
            application.remarks = serializer.validated_data['remarks']
        if application.status in ['APPROVED', 'REJECTED']:
            application.reviewed_by = request.user
            application.reviewed_at = timezone.now()
        if application.status == 'SUBMITTED':
            application.submitted_at = timezone.now()
        application.save()
        return Response({'success': True, 'data': AdmissionApplicationSerializer(application).data})

    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        application = self.get_object()
        if application.status != 'APPROVED':
            return Response(
                {'detail': 'Only APPROVED applications can be enrolled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get params from request
        class_section_id = request.data.get('class_section_id')
        offered_total = request.data.get('offered_total')
        standard_total = request.data.get('standard_total')
        fee_reason = request.data.get('reason', '')

        if not class_section_id:
            return Response({'detail': 'Class Section is required for enrollment.'}, status=400)

        # Fallback to Decimal
        if offered_total is not None:
            offered_total = Decimal(str(offered_total))
        if standard_total is not None:
            standard_total = Decimal(str(standard_total))

        # Auto-generate admission number
        branch = application.branch
        ay = application.academic_year
        admission_number = Student.generate_admission_number(branch, ay)

        student = Student.objects.create(
            tenant=application.tenant,
            branch=branch,
            academic_year=ay,
            class_section_id=class_section_id,
            admission_number=admission_number,
            first_name=application.first_name,
            last_name=application.last_name,
            date_of_birth=application.date_of_birth,
            gender=application.gender,
            blood_group=application.blood_group,
            nationality=application.nationality,
            religion=application.religion,
            caste_category=application.caste_category,
            aadhar_number=application.aadhar_number,
            # Extra fields
            mother_tongue=application.mother_tongue,
            identification_mark_1=application.identification_mark_1,
            identification_mark_2=application.identification_mark_2,
            health_status=application.health_status,
            # Father
            father_name=application.father_name,
            father_phone=application.father_phone,
            father_email=application.father_email,
            father_qualification=application.father_qualification,
            father_occupation=application.father_occupation,
            father_aadhaar=application.father_aadhaar,
            # Mother
            mother_name=application.mother_name,
            mother_phone=application.mother_phone,
            mother_email=application.mother_email,
            mother_qualification=application.mother_qualification,
            mother_occupation=application.mother_occupation,
            mother_aadhaar=application.mother_aadhaar,
            # Guardian
            guardian_name=application.guardian_name,
            guardian_phone=application.guardian_phone,
            guardian_relation=application.guardian_relation,
            # Address
            address_line1=application.address_line1,
            apartment_name=application.apartment_name,
            address_line2=application.address_line2,
            landmark=application.landmark,
            city=application.city,
            mandal=application.mandal,
            district=application.district,
            state=application.state,
            pincode=application.pincode,
            # Academic
            previous_school_name=application.previous_school_name,
            previous_class=application.previous_class,
            previous_school_ay=application.previous_school_ay,
            emergency_contact_name=application.emergency_contact_name,
            emergency_contact_phone=application.emergency_contact_phone,
            emergency_contact_relation=application.emergency_contact_relation,
            # Documents
            doc_tc_submitted=application.doc_tc_submitted,
            doc_bonafide_submitted=application.doc_bonafide_submitted,
            doc_birth_cert_submitted=application.doc_birth_cert_submitted,
            doc_caste_cert_submitted=application.doc_caste_cert_submitted,
            doc_aadhaar_submitted=application.doc_aadhaar_submitted,
            # Other
            application=application,
            created_by=request.user,
        )

        # Handle Fees
        create_student_fees(student, offered_total, standard_total, fee_reason, request.user)

        # Mark application as ENROLLED
        application.status = 'ENROLLED'
        application.save()

        return Response({
            'success': True, 
            'message': f"Student {student.admission_number} enrolled successfully.",
            'student_id': str(student.id),
            'data': StudentSerializer(student).data
        })

    @action(detail=True, methods=['get', 'post'], url_path='documents')
    def documents(self, request, pk=None):
        application = self.get_object()
        if request.method == 'GET':
            docs = application.documents.all()
            return Response({'success': True, 'data': ApplicationDocumentSerializer(docs, many=True).data})
        serializer = ApplicationDocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(application=application)
        return Response({'success': True, 'data': serializer.data}, status=status.HTTP_201_CREATED)


class StudentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTeacherOrAbove]
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'admission_number']

    def get_serializer_class(self):
        if self.action == 'list':
            return StudentListSerializer
        return StudentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Student.objects.filter(branch__tenant=user.tenant).select_related('class_section')
        
        # Branch Isolation
        if user.role not in ['SUPER_ADMIN', 'SCHOOL_ADMIN'] and user.branch:
            qs = qs.filter(branch=user.branch)
            
        status_filter = self.request.query_params.get('status')
        class_section = self.request.query_params.get('class_section_id')
        gender = self.request.query_params.get('gender')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if class_section:
            qs = qs.filter(class_section_id=class_section)
        if gender:
            qs = qs.filter(gender=gender)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        branch = serializer.validated_data.get('branch')
        
        if user.role == 'SUPER_ADMIN':
            tenant = branch.tenant if branch else None
        else:
            tenant = user.tenant
            if branch and branch.tenant != tenant:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only assign students to branches within your school organization.")
                
        if not serializer.validated_data.get('admission_number'):
            ay = serializer.validated_data.get('academic_year')
            if branch and ay:
                serializer.validated_data['admission_number'] = Student.generate_admission_number(branch, ay)
                
        # Fee locking and approval logic

        offered_total = serializer.validated_data.pop('offered_total', None)
        standard_total = serializer.validated_data.pop('standard_total', None)
        fee_reason = serializer.validated_data.pop('reason', '')
        
            
        student = serializer.save(tenant=tenant, created_by=user)
        
        # Use shared fee creation logic
        create_student_fees(student, offered_total, standard_total, fee_reason, user)

    def destroy(self, request, *args, **kwargs):
        return Response(
            {'detail': 'Deletion is not allowed. Use PATCH status=INACTIVE instead.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        student = self.get_object()
        new_status = request.data.get('status')
        if new_status:
            student.status = new_status
            if new_status == 'TRANSFERRED':
                student.leaving_date = request.data.get('leaving_date', timezone.now().date())
                student.leaving_reason = request.data.get('leaving_reason', '')
            student.save()
        return Response({'success': True, 'data': StudentSerializer(student).data})


class ParentStudentRelationViewSet(viewsets.ModelViewSet):
    serializer_class = ParentStudentRelationSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        qs = ParentStudentRelation.objects.filter(student__branch__tenant=self.request.user.tenant)
        student_id = self.request.query_params.get('student_id')
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs
