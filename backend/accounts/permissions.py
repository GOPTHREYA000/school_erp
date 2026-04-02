from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'SUPER_ADMIN')

class IsSchoolAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        # Maps to the old TRUST_OWNER logic (now SCHOOL_ADMIN)
        return bool(request.user and request.user.is_authenticated and request.user.role in ['SUPER_ADMIN', 'SCHOOL_ADMIN'])

class IsBranchAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        # Maps to the old SCHOOL_ADMIN logic (now BRANCH_ADMIN)
        # Grant permissions to Accountants as well (similar to Branch Admin)
        return bool(request.user and request.user.is_authenticated and request.user.role in ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT'])

class IsAccountant(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT'])

class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'TEACHER', 'ACCOUNTANT'])

class IsParent(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'PARENT')

# Aliases for backwards compatibility or explicit naming in views
IsSchoolAdminOrAbove = IsBranchAdmin
IsBranchAdminOrAbove = IsBranchAdmin
IsTeacherOrAbove = IsTeacher
