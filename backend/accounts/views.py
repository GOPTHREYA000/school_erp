import logging
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)

class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        logger.info(f"Login attempt: {request.data.get('email')}")
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            logger.info(f"Login successful: {request.data.get('email')}")
        except Exception as e:
            logger.warning(f"Login failed for {request.data.get('email')}: {type(e).__name__}")
            raise e

        is_secure = not settings.DEBUG
        response = Response({"success": True, "message": "Login successful"}, status=status.HTTP_200_OK)
        # Set cookies
        response.set_cookie(
            'access_token',
            serializer.validated_data['access'],
            max_age=3600,
            httponly=True,
            secure=is_secure,
            samesite='Lax'
        )
        response.set_cookie(
            'refresh_token',
            serializer.validated_data['refresh'],
            max_age=86400 * 7,
            httponly=True,
            secure=is_secure,
            samesite='Lax'
        )
        return response

class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response({"success": False, "error": {"code": "NO_REFRESH_TOKEN"}}, status=status.HTTP_401_UNAUTHORIZED)
        
        request.data['refresh'] = refresh_token
        try:
            response_data = super().post(request, *args, **kwargs)
        except Exception as e:
            return Response({"success": False, "error": {"code": "TOKEN_EXPIRED"}}, status=status.HTTP_401_UNAUTHORIZED)

        is_secure = not settings.DEBUG
        response = Response({"success": True}, status=status.HTTP_200_OK)
        response.set_cookie(
            'access_token',
            response_data.data['access'],
            max_age=3600,
            httponly=True,
            secure=is_secure,
            samesite='Lax'
        )
        return response

class LogoutView(APIView):
    def post(self, request):
        # Blacklist the refresh token to prevent reuse
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass  # Token may already be blacklisted or invalid
        response = Response({"success": True, "message": "Logout successful"}, status=status.HTTP_200_OK)
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({"success": True, "data": serializer.data})

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
from .permissions import IsBranchAdminOrAbove, ROLE_HIERARCHY

# Only these roles can manage (create/update/delete) other users
ROLES_THAT_CAN_MANAGE_USERS = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN']

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsBranchAdminOrAbove]

    def _get_rank(self, role):
        return ROLE_HIERARCHY.get(role, 0)

    def check_permissions(self, request):
        super().check_permissions(request)
        # For mutation operations, only admins can manage users
        if request.method not in ('GET', 'HEAD', 'OPTIONS'):
            if request.user.role not in ROLES_THAT_CAN_MANAGE_USERS:
                raise PermissionDenied("Only admins can manage users.")

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

        creator_rank = self._get_rank(creator_role)
        target_rank = self._get_rank(target_role)

        # Cannot create user with equal or higher privilege (higher rank = more privilege)
        if target_rank >= creator_rank and creator_role != 'SUPER_ADMIN':
            raise PermissionDenied("You do not have permission to create a user with this role.")

        tenant = None
        if creator_role != 'SUPER_ADMIN':
            tenant = self.request.user.tenant
        else:
            # If super admin, they must specify a tenant for non-platform roles
            tenant = serializer.validated_data.get('tenant')
            if not tenant and target_role != 'SUPER_ADMIN':
               tenant_id = self.request.data.get('tenant_id') or self.request.data.get('tenant')
               if tenant_id:
                   from tenants.models import Tenant
                   try:
                       tenant = Tenant.objects.get(id=tenant_id)
                   except (Tenant.DoesNotExist, ValueError):
                       pass
            
            if not tenant and target_role != 'SUPER_ADMIN':
                if target_role == 'SCHOOL_ADMIN':
                    from tenants.models import Tenant
                    first_name = serializer.validated_data.get('first_name', '')
                    last_name = serializer.validated_data.get('last_name', '')
                    tenant_name = f"{first_name} {last_name}'s School".strip()
                    tenant = Tenant.objects.create(name=tenant_name)
                else:
                    raise PermissionDenied('Tenant is required when creating non-platform users.')

        branch = serializer.validated_data.get('branch')
        
        # If the creator is a BRANCH_ADMIN, they can ONLY create users for their own branch.
        if creator_role == 'BRANCH_ADMIN':
            branch = self.request.user.branch
            
        serializer.save(tenant=tenant, branch=branch)

    def perform_update(self, serializer):
        creator_role = self.request.user.role
        target_role = serializer.validated_data.get('role', serializer.instance.role)

        creator_rank = self._get_rank(creator_role)
        target_rank = self._get_rank(target_role)
        instance_rank = self._get_rank(serializer.instance.role)

        if (target_rank >= creator_rank or instance_rank >= creator_rank) and creator_role != 'SUPER_ADMIN':
            raise PermissionDenied("You cannot modify users of this role level.")

        serializer.save()

    def perform_destroy(self, instance):
        creator_role = self.request.user.role
        creator_rank = self._get_rank(creator_role)
        instance_rank = self._get_rank(instance.role)

        if instance.id == self.request.user.id:
            raise PermissionDenied("You cannot delete your own account.")

        if instance_rank >= creator_rank and creator_role != 'SUPER_ADMIN':
            raise PermissionDenied("You cannot delete a user with equal or higher privileges.")

        # PROTECT: Deactivate SCHOOL_ADMIN instead of deleting to preserve tenant data.
        if instance.role == 'SCHOOL_ADMIN':
            instance.is_active = False
            instance.save()
            return
            
        instance.delete()

