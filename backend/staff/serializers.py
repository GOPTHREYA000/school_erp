from django.db import transaction
from rest_framework import serializers
from .models import TeacherProfile, TeacherAssignment
from accounts.models import User
from accounts.serializers import UserSerializer

from tenants.models import Branch

class TeacherAssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.user.first_name', read_only=True)
    class_name = serializers.CharField(source='class_section.display_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = TeacherAssignment
        fields = [
            'id', 'tenant', 'teacher', 'teacher_name', 'class_section', 'class_name', 
            'subject_name', 'subject', 'is_class_teacher', 'academic_year'
        ]
        read_only_fields = ['id', 'tenant']

class TeacherProfileSerializer(serializers.ModelSerializer):
    # For listing
    user_details = UserSerializer(source='user', read_only=True)
    assignments = TeacherAssignmentSerializer(many=True, read_only=True)
    
    # For creation (flattened user fields)
    email = serializers.EmailField(write_only=True, required=True)
    first_name = serializers.CharField(write_only=True, required=True)
    last_name = serializers.CharField(write_only=True, required=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False)
    branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.none(), # Will be set in __init__
        write_only=True, 
        required=False
    )

    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'tenant', 'user', 'user_details', 'assignments', 'employee_id', 
            'qualification', 'specialization', 'joining_date', 'bio', 'is_active', 
            'created_at', 'email', 'first_name', 'last_name', 'phone', 'password', 'branch'
        ]
        read_only_fields = ['id', 'tenant', 'created_at', 'employee_id']
        extra_kwargs = {
            'user': {'required': False}
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from tenants.models import Branch
        request = self.context.get('request')
        if request and request.user:
            if request.user.role == 'SUPER_ADMIN':
                self.fields['branch'].queryset = Branch.objects.all()
            else:
                self.fields['branch'].queryset = Branch.objects.filter(tenant=request.user.tenant)

    def create(self, validated_data):
        email = validated_data.pop('email', None)
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        phone = validated_data.pop('phone', '')
        password = validated_data.pop('password', 'Password123!')
        branch = validated_data.pop('branch', None)
        tenant = validated_data.get('tenant')

        with transaction.atomic():
            if email:
                user = User.objects.create_user(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    phone=phone,
                    role='TEACHER',
                    tenant=tenant,
                    branch=branch,
                    password=password
                )
                validated_data['user'] = user
                validated_data['branch'] = branch
            
            return super().create(validated_data)
