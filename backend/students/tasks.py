from celery import shared_task
from django.core.files.storage import default_storage
import logging
from students.csv_import import process_csv_file
from students.models import CsvImportJob
from django.db import transaction

logger = logging.getLogger(__name__)

@shared_task(bind=True)
def process_student_csv_import(self, job_id):
    """
    Celery task to process the CSV import asynchronously in chunks.
    """
    try:
        job = CsvImportJob.objects.get(id=job_id)
        job.status = 'PROCESSING'
        job.save(update_fields=['status'])
        
        # Read file
        with job.file.open('rb') as f:
            raw_bytes = f.read()
            
        try:
            decoded_file = raw_bytes.decode('utf-8-sig')
        except UnicodeDecodeError:
            try:
                decoded_file = raw_bytes.decode('latin-1')
            except UnicodeDecodeError:
                job.status = 'FAILED'
                job.error_log = ["File encoding not supported. Please save as UTF-8 CSV."]
                job.save(update_fields=['status', 'error_log'])
                return
                
        # We pass the decoded content and the job to the actual logic
        process_csv_file(job, decoded_file)
        
    except Exception as e:
        logger.error(f"Failed to process CSV import job {job_id}: {str(e)}")
        try:
            job = CsvImportJob.objects.get(id=job_id)
            job.status = 'FAILED'
            if not job.error_log:
                job.error_log = [str(e)]
            job.save()
        except Exception:
            pass
