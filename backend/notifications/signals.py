from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from fees.models import Payment, FeeInvoice

from .dispatcher import dispatch_notification
from .in_app_helpers import (
    fee_invoice_parent_payload,
    payment_parent_payload,
    in_app_invoice_event_exists,
    in_app_payment_confirmed_exists,
)


@receiver(pre_save, sender=FeeInvoice)
def _fee_invoice_track_status(sender, instance, **kwargs):
    if not instance.pk:
        instance._notif_prev_status = None
        return
    try:
        instance._notif_prev_status = (
            FeeInvoice.objects.only('status').get(pk=instance.pk).status
        )
    except FeeInvoice.DoesNotExist:
        instance._notif_prev_status = None


@receiver(post_save, sender=FeeInvoice)
def fee_invoice_in_app_to_parent(sender, instance, created, **kwargs):
    """
    In-app only: new / sent invoices and overdue status for parents.
    Academic and transport (TRN-*) invoices use the same events with fee_kind in payload.
    """
    parent = instance.student.primary_parent
    if not parent:
        return

    prev = getattr(instance, '_notif_prev_status', None)
    payload = fee_invoice_parent_payload(instance)

    # Landed on SENT (new issue or workflow send) — one INVOICE_GENERATED per invoice.
    if instance.status == 'SENT':
        if not created and prev == 'SENT':
            return
        if in_app_invoice_event_exists(parent, 'INVOICE_GENERATED', instance.id):
            return
        dispatch_notification(
            tenant=instance.tenant,
            branch=instance.branch,
            event_type='INVOICE_GENERATED',
            recipient_user=parent,
            payload=payload,
            send_sms=False,
            send_email=False,
            send_push=True,
        )
        return

    # Explicit overdue status
    if instance.status == 'OVERDUE':
        if not created and prev == 'OVERDUE':
            return
        if in_app_invoice_event_exists(parent, 'PAYMENT_OVERDUE', instance.id):
            return
        dispatch_notification(
            tenant=instance.tenant,
            branch=instance.branch,
            event_type='PAYMENT_OVERDUE',
            recipient_user=parent,
            payload=payload,
            send_sms=False,
            send_email=False,
            send_push=True,
        )


@receiver(post_save, sender=Payment)
def payment_completed_in_app_to_parent(sender, instance, **kwargs):
    if instance.status != 'COMPLETED':
        return
    parent = instance.student.primary_parent
    if not parent:
        return
    if in_app_payment_confirmed_exists(parent, instance.id):
        return
    payload = payment_parent_payload(instance)
    dispatch_notification(
        tenant=instance.tenant,
        branch=instance.branch,
        event_type='PAYMENT_CONFIRMED',
        recipient_user=parent,
        payload=payload,
        send_sms=False,
        send_email=False,
        send_push=True,
    )
