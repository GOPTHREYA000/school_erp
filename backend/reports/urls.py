from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportingViewSet, SuperAdminReportingViewSet

router = DefaultRouter()
router.register(r'reports/platform', SuperAdminReportingViewSet, basename='reports-platform')
router.register(r'reports', ReportingViewSet, basename='reports')

urlpatterns = [
    path('', include(router.urls)),
]
