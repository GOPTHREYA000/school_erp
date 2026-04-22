from rest_framework import permissions

# Single source of truth for role hierarchy across the entire system.
# Higher number = more privilege. Used by has_min_role() for permission checks.
ROLE_HIERARCHY = {
    'SUPER_ADMIN': 100,
    'SCHOOL_ADMIN': 80,
    'BRANCH_ADMIN': 60,
    'ACCOUNTANT': 55,   # Below BRANCH_ADMIN — cannot manage users
    'TEACHER': 40,
    'PARENT': 10,
}

def has_min_role(user, min_role):
    if not user.is_authenticated:
        return False
    user_rank = ROLE_HIERARCHY.get(user.role, 0)
    min_rank = ROLE_HIERARCHY.get(min_role, 0)
    return user_rank >= min_rank

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return has_min_role(request.user, 'SUPER_ADMIN')

class IsSchoolAdminOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return has_min_role(request.user, 'SCHOOL_ADMIN')

class IsBranchAdminOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return has_min_role(request.user, 'BRANCH_ADMIN')

class IsAccountantOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return has_min_role(request.user, 'ACCOUNTANT')

class IsTeacherOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return has_min_role(request.user, 'TEACHER')

class IsParentOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return has_min_role(request.user, 'PARENT')

