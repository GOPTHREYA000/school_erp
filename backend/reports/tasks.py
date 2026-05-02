import logging
from celery import shared_task

from .models import ExportJob
from .pdf_pipeline import process_export_job

logger = logging.getLogger(__name__)


@shared_task
def generate_export_job(job_id):
    try:
        process_export_job(job_id)
    except Exception:
        logger.exception("Export job %s failed", job_id)
        job = ExportJob.objects.filter(id=job_id).first()
        if job:
            job.status = 'FAILED'
            job.error_message = 'Export failed. See server logs for details.'
            job.save(update_fields=['status', 'error_message'])
