from celery import shared_task
from django.utils import timezone
import logging
import time

logger = logging.getLogger(__name__)

@shared_task
def process_pending_notifications():
    """
    Task to find all PENDING NotificationLogs and 'send' them.
    In a real system, this would make API calls to Twilio, SendGrid, etc.
    For now, it simulates sending and updates the status to DELIVERED.
    """
    from .models import NotificationLog
    
    pending_logs = NotificationLog.objects.filter(status='PENDING')
    count = pending_logs.count()
    if count == 0:
        return f"No pending notifications."
        
    logger.info(f"Processing {count} pending notifications...")
    
    delivered_count = 0
    failed_count = 0
    
    for log in pending_logs:
        try:
            # Simulate network delay for API call
            time.sleep(0.5)
            
            # Here you would integrate with AWS SES, SendGrid, Twilio, etc.
            if log.channel == 'SMS':
                logger.info(f"[SMS Dummy] Sending to {log.recipient_phone}: {log.payload.get('message')}")
            elif log.channel == 'EMAIL':
                logger.info(f"[EMAIL Dummy] Sending to {log.recipient_email}: Subject: {log.payload.get('title')}")
                
            log.status = 'DELIVERED'
            log.sent_at = timezone.now()
            log.save()
            delivered_count += 1
        except Exception as e:
            logger.error(f"Failed to send notification {log.id}: {str(e)}")
            log.status = 'FAILED'
            log.save()
            failed_count += 1
            
    return f"Processed {count} notifications: {delivered_count} delivered, {failed_count} failed."
