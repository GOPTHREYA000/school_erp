from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

class LoginView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        response = Response({"success": True, "message": "Login successful"}, status=status.HTTP_200_OK)
        # Set cookies
        response.set_cookie(
            'access_token',
            serializer.validated_data['access'],
            max_age=3600,
            httponly=True,
            samesite='Lax'
        )
        response.set_cookie(
            'refresh_token',
            serializer.validated_data['refresh'],
            max_age=86400 * 7,
            httponly=True,
            samesite='Lax'
        )
        return response

class RefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response({"success": False, "error": {"code": "NO_REFRESH_TOKEN"}}, status=status.HTTP_401_UNAUTHORIZED)
        
        request.data['refresh'] = refresh_token
        try:
            response_data = super().post(request, *args, **kwargs)
        except Exception as e:
            return Response({"success": False, "error": {"code": "TOKEN_EXPIRED"}}, status=status.HTTP_401_UNAUTHORIZED)

        response = Response({"success": True}, status=status.HTTP_200_OK)
        response.set_cookie(
            'access_token',
            response_data.data['access'],
            max_age=3600,
            httponly=True,
            samesite='Lax'
        )
        return response

class LogoutView(APIView):
    def post(self, request):
        response = Response({"success": True, "message": "Logout successful"}, status=status.HTTP_200_OK)
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "tenant_id": user.tenant.id if user.tenant else None,
            "branch_id": user.branch.id if user.branch else None
        }
        return Response({"success": True, "data": data})

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, *args, **kwargs):
        from .serializers import ChangePasswordSerializer
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            if not request.user.check_password(serializer.data.get("old_password")):
                return Response({"error": "Wrong password."}, status=status.HTTP_400_BAD_REQUEST)
            request.user.set_password(serializer.data.get("new_password"))
            request.user.save()
            return Response({"success": True, "message": "Password updated successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from .models import User
from .serializers import UserSerializer
from .permissions import IsBranchAdminOrAbove

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsBranchAdminOrAbove]  # Minimum level to create lower users

    # Role Hierarchy: Index represents rank (lower is more powerful)
    ROLE_RANKS = {
        'SUPER_ADMIN': 0,
        'SCHOOL_ADMIN': 1,
        'BRANCH_ADMIN': 2,
        'ACCOUNTANT': 3,
        'TEACHER': 3,
        'PARENT': 4,
    }

    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPER_ADMIN':
            return User.objects.all()
        # Non-super admins only see users in their tenant
        qs = User.objects.filter(tenant=user.tenant)
        
        # Branch isolation: Branch Admin and lower roles only see users in their own branch
        if user.role not in ['SUPER_ADMIN', 'SCHOOL_ADMIN'] and user.branch:
            qs = qs.filter(branch=user.branch)
            
        return qs

    def perform_create(self, serializer):
        creator_role = self.request.user.role
        target_role = serializer.validated_data.get('role')

        creator_rank = self.ROLE_RANKS.get(creator_role, 99)
        target_rank = self.ROLE_RANKS.get(target_role, 99)

        if target_rank <= creator_rank and creator_role != 'SUPER_ADMIN':
            raise PermissionDenied("You do not have permission to create a user with this role.")

        tenant = None
        if creator_role != 'SUPER_ADMIN':
            tenant = self.request.user.tenant
        else:
            tenant = serializer.validated_data.get('tenant', self.request.user.tenant)

        branch = serializer.validated_data.get('branch')
        
        # If the creator is a SCHOOL_ADMIN, they can set the branch.
        # If the creator is a BRANCH_ADMIN, they can ONLY create users for their own branch.
        if creator_role == 'BRANCH_ADMIN':
            branch = self.request.user.branch
            
        serializer.save(tenant=tenant, branch=branch)

    def perform_update(self, serializer):
        creator_role = self.request.user.role
        target_role = serializer.validated_data.get('role', serializer.instance.role)

        creator_rank = self.ROLE_RANKS.get(creator_role, 99)
        target_rank = self.ROLE_RANKS.get(target_role, 99)
        instance_rank = self.ROLE_RANKS.get(serializer.instance.role, 99)

        if (target_rank <= creator_rank or instance_rank <= creator_rank) and creator_role != 'SUPER_ADMIN':
            raise PermissionDenied("You cannot modify users of this role level.")

        serializer.save()

    def perform_destroy(self, instance):
        creator_role = self.request.user.role
        creator_rank = self.ROLE_RANKS.get(creator_role, 99)
        instance_rank = self.ROLE_RANKS.get(instance.role, 99)

        if instance.id == self.request.user.id:
            raise PermissionDenied("You cannot delete your own account.")

        if instance_rank <= creator_rank and creator_role != 'SUPER_ADMIN':
            raise PermissionDenied("You cannot delete a user with equal or higher privileges.")

        # Cascading Deletion Logic
        if instance.role == 'SCHOOL_ADMIN' and instance.tenant is not None:
            # When a School Admin is removed, the entire tenant (school group) is destroyed.
            # This triggers a Django cascade delete across all users, branches, etc tied to this tenant.
            instance.tenant.delete()
        else:
            instance.delete()
