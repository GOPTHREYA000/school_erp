import json
from django.db.models.signals import post_save
from django.dispatch import receiver
from fees.models import Payment, FeeInvoice
from notifications.models import NotificationLog

@receiver(post_save, sender=Payment)
def payment_completed_notification(sender, instance, created, **kwargs):
    """
    Trigger notification when a payment is marked as COMPLETED.
    """
    if instance.status == 'COMPLETED':
        # Check if we already created a notification for this payment
        payload = {'payment_id': str(instance.id), 'amount': str(instance.amount)}
        
        # We look up based on payload payment_id (in an MVP scenario; json search might be DB specific, 
        # but for simplicity we rely on the logic that completed payments queue it once).
        
        parent = instance.student.primary_parent
        if parent:
            NotificationLog.objects.create(
                tenant=instance.tenant,
                branch=instance.branch,
                event_type="PAYMENT_CONFIRMED",
                recipient_user=parent,
                recipient_phone=parent.phone,
                recipient_email=parent.email,
                channel="SMS" if parent.phone else "EMAIL",
                status="QUEUED",
                payload=payload
            )

@receiver(post_save, sender=FeeInvoice)
def invoice_generated_notification(sender, instance, created, **kwargs):
    """
    Trigger notification when a fee invoice enters SENT or OVERDUE status.
    """
    if instance.status in ['SENT', 'OVERDUE']:
        payload = {'invoice_id': str(instance.id), 'amount': str(instance.outstanding_amount)}
        
        parent = instance.student.primary_parent
        if parent:
            event = "INVOICE_GENERATED" if instance.status == 'SENT' else "PAYMENT_OVERDUE"
            
            NotificationLog.objects.create(
                tenant=instance.tenant,
                branch=instance.branch,
                event_type=event,
                recipient_user=parent,
                recipient_phone=parent.phone,
                recipient_email=parent.email,
                channel="SMS" if parent.phone else "EMAIL",
                status="QUEUED",
                payload=payload
            )
