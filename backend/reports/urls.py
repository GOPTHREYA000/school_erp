from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ReportingViewSet, SuperAdminReportingViewSet,
    AdmitReportViewSet, AcademicsReportViewSet, PaymentsReportViewSet,
    StaffReportViewSet, BusReportViewSet, PastDuesReportViewSet,
    ExportViewSet
)

router = DefaultRouter()

# New Routes
router.register(r'reports/admit', AdmitReportViewSet, basename='reports-admit')
router.register(r'reports/academics', AcademicsReportViewSet, basename='reports-academics')
router.register(r'reports/payments', PaymentsReportViewSet, basename='reports-payments')
router.register(r'reports/staff', StaffReportViewSet, basename='reports-staff')
router.register(r'reports/bus', BusReportViewSet, basename='reports-bus')
router.register(r'reports/past-dues', PastDuesReportViewSet, basename='reports-past-dues')
router.register(r'reports/export', ExportViewSet, basename='reports-export')

# Preserved Routes
router.register(r'reports/platform', SuperAdminReportingViewSet, basename='reports-platform')
router.register(r'reports', ReportingViewSet, basename='reports')

urlpatterns = [
    path('', include(router.urls)),
]
