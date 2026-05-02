"""
Unified async export pipeline: build rows → Excel or PDF → attach to ExportJob.
"""
import logging

from django.utils import timezone

from .models import ExportJob
from .export_utils import generate_excel_file, generate_pdf_file
from .export_filters import ExportFilterBundle
from .export_rows import build_export_rows

logger = logging.getLogger(__name__)


def process_export_job(job_id) -> None:
    """
    Run a single export job to completion (COMPLETED / FAILED).
    Celery task should call this and rely on exceptions for Sentry/logging.
    """
    job = ExportJob.objects.get(id=job_id)
    job.status = 'PROCESSING'
    job.save(update_fields=['status'])

    bundle = ExportFilterBundle.from_job(job)
    built = build_export_rows(job.report_type, bundle)

    if not built:
        job.status = 'FAILED'
        job.error_message = f'Unsupported report_type: {job.report_type}'
        job.completed_at = timezone.now()
        job.save(update_fields=['status', 'error_message', 'completed_at'])
        return

    headers, data_rows = built

    if not headers:
        job.status = 'FAILED'
        job.error_message = (
            f'Report "{job.report_type}" produced no columns. '
            'Contact support or check for a product update.'
        )
        job.completed_at = timezone.now()
        job.save(update_fields=['status', 'error_message', 'completed_at'])
        return

    if job.file_format == 'PDF':
        try:
            file_url = generate_pdf_file(job.report_type, headers, data_rows)
        except RuntimeError as pdf_err:
            job.status = 'FAILED'
            job.error_message = str(pdf_err)
            job.completed_at = timezone.now()
            job.save(update_fields=['status', 'error_message', 'completed_at'])
            return
    else:
        file_url = generate_excel_file(job.report_type, headers, data_rows)

    job.file_url = file_url
    job.status = 'COMPLETED'
    job.completed_at = timezone.now()
    job.save(update_fields=['file_url', 'status', 'completed_at'])
