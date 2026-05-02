"""Tenant resolution middleware for multi-tenant isolation."""

import logging
import threading

from django.conf import settings
from django.http import JsonResponse

logger = logging.getLogger(__name__)
_thread_local = threading.local()


def get_current_tenant():
    """Return the tenant set for the current request thread."""
    return getattr(_thread_local, 'tenant', None)


def set_current_tenant(tenant):
    """Set the tenant for the current request thread."""
    _thread_local.tenant = tenant


def _normalize_host(host: str) -> str:
    if not host:
        return ''
    return host.split(':')[0].strip().lower()


def effective_request_host(request) -> str:
    """
    Hostname used for tenants.Domain resolution.
    Prefers X-School-Origin-Host when trusted (split API + frontend deployments).
    """
    if getattr(settings, 'TENANT_TRUST_ORIGIN_HOST_HEADER', True):
        raw = (request.META.get('HTTP_X_SCHOOL_ORIGIN_HOST') or '').strip()
        if raw:
            first = raw.split(',')[0].strip()
            return _normalize_host(first)
    return _normalize_host(request.get_host())


def resolve_tenant_from_host(host: str):
    """
    Map request Host to a Tenant via tenants.Domain (exact match, then without leading www.).
    Returns Tenant or None.
    """
    host = _normalize_host(host)
    if not host:
        return None
    from tenants.models import Domain

    d = Domain.objects.filter(domain__iexact=host).select_related('tenant').first()
    if d:
        return d.tenant
    if host.startswith('www.'):
        d = Domain.objects.filter(domain__iexact=host[4:]).select_related('tenant').first()
        if d:
            return d.tenant
    return None


class TenantMiddleware:
    """
    Resolves tenant from authenticated user and stores it in thread-local.

    If TENANT_HOST_ENFORCEMENT is enabled and the Host maps to a Domain, non–super-admin
    users must belong to that same tenant (blocks cross-tenant cookie reuse on the wrong host).

    SUPER_ADMIN keeps thread-local tenant cleared so TenantAwareManager does not filter.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        set_current_tenant(None)
        response = self.get_response(request)
        set_current_tenant(None)
        return response

    def process_view(self, request, view_func, view_args, view_kwargs):
        set_current_tenant(None)
        host = effective_request_host(request)
        host_tenant = resolve_tenant_from_host(host)
        request.host_tenant = host_tenant

        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return None

        user = request.user
        enforce = getattr(settings, 'TENANT_HOST_ENFORCEMENT', True)
        if (
            enforce
            and request.path.startswith('/api/')
            and host_tenant
            and getattr(user, 'tenant_id', None)
            and user.role != 'SUPER_ADMIN'
            and user.tenant_id != host_tenant.id
        ):
            return JsonResponse(
                {
                    'detail': (
                        'This account belongs to a different organization than the site you are using. '
                        'Open your school’s web address and try again.'
                    )
                },
                status=403,
            )

        tenant_for_thread = getattr(user, 'tenant', None)
        if user.role == 'SUPER_ADMIN':
            tenant_for_thread = None
        set_current_tenant(tenant_for_thread)
        if tenant_for_thread:
            logger.debug('Tenant resolved: %s for user %s', tenant_for_thread.name, user.email)
        return None
