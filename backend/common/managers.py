"""
Tenant-scoped ORM managers and QuerySet mixins.

These provide an automatic safety net for multi-tenant data isolation.
Instead of manually adding .filter(tenant=user.tenant) to every query,
models using TenantAwareManager will automatically scope to the current
request's tenant (set by TenantMiddleware).

Usage:
    class Student(models.Model):
        tenant = models.ForeignKey('tenants.Tenant', ...)
        ...
        objects = TenantAwareManager()   # Auto-scoped
        all_objects = models.Manager()   # Unscoped (for migrations, admin, Celery)
"""

from django.db import models
from tenants.middleware import get_current_tenant


class TenantAwareQuerySet(models.QuerySet):
    """QuerySet that automatically filters by the current thread-local tenant."""

    def _filter_by_tenant(self):
        tenant = get_current_tenant()
        if tenant:
            return self.filter(tenant=tenant)
        return self

    def all(self):
        return super().all()._filter_by_tenant()


class TenantAwareManager(models.Manager):
    """
    Manager that auto-scopes queries to the current tenant.

    When TenantMiddleware sets the thread-local tenant, all queries through
    this manager are automatically filtered. This prevents accidental
    cross-tenant data leaks.

    Important: SUPER_ADMIN requests have tenant=None in thread-local,
    so they correctly see all data (no filter applied).
    """

    def get_queryset(self):
        qs = TenantAwareQuerySet(self.model, using=self._db)
        tenant = get_current_tenant()
        if tenant:
            return qs.filter(tenant=tenant)
        return qs
