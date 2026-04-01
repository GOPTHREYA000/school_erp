from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TenantViewSet, BranchViewSet, AcademicYearViewSet

router = DefaultRouter()
router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'academic-years', AcademicYearViewSet, basename='academic-year')
router.register(r'', TenantViewSet, basename='tenant')

urlpatterns = [
    path('tenants/', include(router.urls)),
]
