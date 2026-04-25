from .dashboard import ReportingViewSet, SuperAdminReportingViewSet
from .admit import AdmitReportViewSet
from .academics import AcademicsReportViewSet
from .payments import PaymentsReportViewSet
from .staff_reports import StaffReportViewSet
from .bus import BusReportViewSet
from .past_dues import PastDuesReportViewSet
from .export import ExportViewSet

__all__ = [
    'ReportingViewSet',
    'SuperAdminReportingViewSet',
    'AdmitReportViewSet',
    'AcademicsReportViewSet',
    'PaymentsReportViewSet',
    'StaffReportViewSet',
    'BusReportViewSet',
    'PastDuesReportViewSet',
    'ExportViewSet',
]
