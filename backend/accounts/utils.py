"""
Branch access validation utility.
Centralizes branch-level permission enforcement across all ViewSets.
"""
from rest_framework.exceptions import PermissionDenied


def get_validated_branch_id(user, requested_branch_id):
    """
    Returns a validated branch_id string or None.
    
    Rules:
    - SUPER_ADMIN / SCHOOL_ADMIN: can access any branch within their tenant.
      If requested_branch_id is provided, validates it belongs to user's tenant.
      If not provided, returns None (meaning "all branches").
    - BRANCH_ADMIN / ACCOUNTANT / TEACHER: locked to their own branch.
      The requested_branch_id query param is IGNORED — always returns user.branch_id.
    - If a branch_id is requested that doesn't belong to the user's tenant, raises PermissionDenied.
    """
    if user.role in ('SUPER_ADMIN', 'SCHOOL_ADMIN'):
        if requested_branch_id and requested_branch_id not in ('all', ''):
            import uuid as _uuid
            try:
                _uuid.UUID(str(requested_branch_id))
            except ValueError:
                return None  # Invalid UUID format, treat as "all branches"
            from tenants.models import Branch
            if not Branch.objects.filter(id=requested_branch_id, tenant=user.tenant).exists():
                raise PermissionDenied("Access denied: branch does not belong to your organization.")
            return requested_branch_id
        return None  # All branches within tenant
    else:
        # Locked to own branch regardless of what was requested
        return str(user.branch_id) if user.branch_id else None


def get_active_academic_year(tenant):
    """
    Returns the currently active AcademicYear for a tenant, or None.
    Used as a default when no academic_year_id is provided in queries.
    """
    from tenants.models import AcademicYear
    return AcademicYear.objects.filter(tenant=tenant, is_active=True).first()


def log_audit_action(user, action, model_name, record_id, details=None, tenant=None):
    """
    Logs an audit action. Since we wrap operations in @transaction.atomic,
    if the main operation fails, the audit log will also rollback.
    """
    from accounts.models import AuditLog
    AuditLog.objects.create(
        tenant=tenant or user.tenant,
        user=user,
        action=action,
        model_name=model_name,
        record_id=record_id,
        details=details or {}
    )


def log_bulk_action(user, action_type, record_count, details=None):
    """
    Logs a bulk action (e.g. bulk reminders, bulk approvals).
    """
    from accounts.models import BulkActionLog
    BulkActionLog.objects.create(
        tenant=user.tenant,
        performed_by=user,
        action_type=action_type,
        record_count=record_count,
        details=details or {}
    )

