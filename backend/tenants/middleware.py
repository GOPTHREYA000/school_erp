"""Tenant resolution middleware for multi-tenant isolation."""

import threading
import logging

logger = logging.getLogger(__name__)
_thread_local = threading.local()


def get_current_tenant():
    """Return the tenant set for the current request thread."""
    return getattr(_thread_local, 'tenant', None)


def set_current_tenant(tenant):
    """Set the tenant for the current request thread."""
    _thread_local.tenant = tenant


class TenantMiddleware:
    """
    Resolves tenant from authenticated user and stores it in thread-local.
    
    Services and managers can call get_current_tenant() to enforce scoping
    without requiring tenant to be passed explicitly through every function.
    
    This is backward-compatible — existing code that passes tenant explicitly
    continues to work. This middleware adds a safety net for new code.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Clear tenant at start of every request
        set_current_tenant(None)

        response = self.get_response(request)

        # Clear after request
        set_current_tenant(None)
        return response

    def process_view(self, request, view_func, view_args, view_kwargs):
        if hasattr(request, 'user') and request.user.is_authenticated:
            tenant = getattr(request.user, 'tenant', None)
            set_current_tenant(tenant)
            if tenant:
                logger.debug(f"Tenant resolved: {tenant.name} for user {request.user.email}")
        return None
