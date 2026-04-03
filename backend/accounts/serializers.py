from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True, default=None)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True, default=None)
    tenant_logo = serializers.CharField(source='tenant.logo_url', read_only=True, default=None)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_active', 
            'password', 'tenant', 'branch', 'branch_name', 'tenant_name', 'tenant_logo'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'tenant': {'read_only': True}
        }

    def validate(self, data):
        tenant = data.get('tenant') or (self.instance.tenant if self.instance else None)
        branch = data.get('branch')
        if branch and tenant and branch.tenant != tenant:
            raise serializers.ValidationError({"branch": "Branch must belong to the user's tenant."})
        return data

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
