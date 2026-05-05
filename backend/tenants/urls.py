from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TenantViewSet, BranchViewSet, AcademicYearViewSet, SuperAdminTenantViewSet, GlobalSettingViewSet, ZoneViewSet

router = DefaultRouter()
router.register(r'zones', ZoneViewSet, basename='zone')
router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'academic-years', AcademicYearViewSet, basename='academic-year')
router.register(r'global-settings', GlobalSettingViewSet, basename='global-setting')
router.register(r'super-admin/all', SuperAdminTenantViewSet, basename='super-admin-tenant')
router.register(r'', TenantViewSet, basename='tenant')

urlpatterns = [
    path('', include(router.urls)),
]
