from rest_framework import permissions
from accounts.permissions import ROLE_HIERARCHY, has_min_role

class ReportAccessPermission(permissions.BasePermission):
    """
    Allows access only to SCHOOL_ADMIN, BRANCH_ADMIN, and ACCOUNTANT.
    Blocks TEACHER and PARENT.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # TEACHER and PARENT have no access
        if request.user.role in ['TEACHER', 'PARENT']:
            return False
            
        # Minimum role is ACCOUNTANT
        return has_min_role(request.user, 'ACCOUNTANT')
