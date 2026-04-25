import logging
from celery import shared_task
from django.utils import timezone
from .models import ExportJob
from .export_utils import generate_excel_file

logger = logging.getLogger(__name__)

@shared_task
def generate_export_job(job_id):
    try:
        job = ExportJob.objects.get(id=job_id)
        job.status = 'PROCESSING'
        job.save(update_fields=['status'])
        
        # We need a generic way to pass the right headers and data based on report_type
        # In a real impl, we'd map report_type to the service method
        # Here's a simplified dispatch
        headers = []
        data_rows = []
        
        # A mocked/generic mapping (we can expand this)
        if job.report_type == 'ADMIT_APPLICANTS':
            headers = ['Application ID', 'Name', 'Class', 'Status', 'Date']
            data_rows = [['APP-001', 'Test User', 'Grade 1', 'SUBMITTED', '2026-04-20']]
            # In Phase 2: call AdmitService.get_applicants(job.filters) and format rows
            
        elif job.report_type == 'FEE_BALANCES':
            headers = ['Invoice No', 'Student', 'Class', 'Outstanding', 'Due Date']
            data_rows = [['INV-001', 'Test User', 'Grade 1', '15000.00', '2026-04-20']]
            
        # ... logic to fetch actual data using the specific service methods with job.filters inside a mock filters object ...

        # Generate the Excel file
        file_url = generate_excel_file(job.report_type, headers, data_rows)
        
        job.file_url = file_url
        job.status = 'COMPLETED'
        job.completed_at = timezone.now()
        job.save(update_fields=['file_url', 'status', 'completed_at'])
        
    except Exception as e:
        logger.error(f"Export Job {job_id} failed: {str(e)}")
        job = ExportJob.objects.filter(id=job_id).first()
        if job:
            job.status = 'FAILED'
            job.error_message = str(e)
            job.save(update_fields=['status', 'error_message'])
