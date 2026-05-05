"""
Notification dispatcher: creates NotificationLog rows.

In-app (push) uses channel IN_APP with status DELIVERED immediately.
Optional SMS/EMAIL create separate PENDING rows for Celery workers.
"""
import logging
from django.utils import timezone
from .models import NotificationLog, NotificationTemplate

logger = logging.getLogger(__name__)


def dispatch_notification(
    tenant,
    branch,
    event_type: str,
    recipient_user=None,
    payload: dict = None,
    send_sms: bool = False,
    send_email: bool = False,
    send_push: bool = True,
):
    """
    Create an in-app notification for a parent user.
    
    Args:
        tenant: Tenant instance
        branch: Branch instance
        event_type: One of NOTIFICATION_EVENTS (e.g. 'INVOICE_GENERATED')
        recipient_user: The parent User to notify
        payload: Dict with context data (student_name, amount, etc.)
    
    Returns:
        NotificationLog instance or None if skipped
    """
    if not recipient_user:
        logger.warning(f"dispatch_notification skipped: no recipient for {event_type}")
        return None

    # Universal notification (no role restriction)

    # Build message from template if available, otherwise use payload directly
    template = NotificationTemplate.objects.filter(
        event_type=event_type,
        branch=branch,
    ).first() or NotificationTemplate.objects.filter(
        event_type=event_type,
        tenant=tenant,
        branch__isnull=True,
    ).first()

    base_payload = dict(payload or {})
    message = _build_message(event_type, template, base_payload)
    title = _event_title(event_type, base_payload)

    # Published announcements supply their own title/body; keep them for the bell.
    if event_type == 'CUSTOM_ANNOUNCEMENT':
        if base_payload.get('title'):
            title = base_payload['title']
        if base_payload.get('message'):
            message = base_payload['message']

    final_payload = {**base_payload, 'title': title, 'message': message}

    logs = []
    
    if send_push:
        logs.append(NotificationLog.objects.create(
            tenant=tenant,
            branch=branch,
            event_type=event_type,
            recipient_user=recipient_user,
            recipient_email=recipient_user.email,
            channel='IN_APP',
            status='DELIVERED',
            payload=final_payload,
            sent_at=timezone.now(),
        ))
        
    if send_sms and hasattr(recipient_user, 'phone') and getattr(recipient_user, 'phone', None):
        logs.append(NotificationLog.objects.create(
            tenant=tenant,
            branch=branch,
            event_type=event_type,
            recipient_user=recipient_user,
            recipient_phone=getattr(recipient_user, 'phone', ''),
            channel='SMS',
            status='PENDING', # Ready to be picked up by Celery task
            payload=final_payload,
        ))
        
    if send_email and getattr(recipient_user, 'email', None):
        logs.append(NotificationLog.objects.create(
            tenant=tenant,
            branch=branch,
            event_type=event_type,
            recipient_user=recipient_user,
            recipient_email=recipient_user.email,
            channel='EMAIL',
            status='PENDING', # Ready to be picked up by Celery task
            payload=final_payload,
        ))

    return logs[0] if logs else None


def dispatch_bulk_notifications(
    tenant,
    branch,
    event_type: str,
    recipient_users,
    payload: dict = None,
    send_sms: bool = False,
    send_email: bool = False,
    send_push: bool = True,
):
    """
    Send the same notification to multiple parent users.
    Returns list of created NotificationLog entries.
    """
    results = []
    for user in recipient_users:
        result = dispatch_notification(
            tenant=tenant,
            branch=branch,
            event_type=event_type,
            recipient_user=user,
            payload=payload,
            send_sms=send_sms,
            send_email=send_email,
            send_push=send_push,
        )
        if result:
            results.append(result)
    return results


def _event_title(event_type: str, context: dict = None) -> str:
    """Human-readable title for each event type."""
    context = context or {}
    if context.get('fee_kind') == 'admission':
        if event_type == 'INVOICE_GENERATED':
            return 'Admission Fee Due'
        if event_type == 'PAYMENT_CONFIRMED':
            return 'Admission Fee Received'
        if event_type in ('PAYMENT_OVERDUE', 'FEE_REMINDER', 'FEE_REMINDER_3DAYS'):
            return 'Admission Fee Reminder'
    if context.get('fee_kind') == 'transport':
        if event_type == 'INVOICE_GENERATED':
            return 'Transport Fee Invoice'
        if event_type == 'PAYMENT_CONFIRMED':
            return 'Transport Fee Paid'
        if event_type in ('PAYMENT_OVERDUE', 'FEE_REMINDER', 'FEE_REMINDER_3DAYS'):
            return 'Transport Fee Reminder'
    titles = {
        'INVOICE_GENERATED': 'New Fee Invoice',
        'PAYMENT_CONFIRMED': 'Payment Received',
        'PAYMENT_OVERDUE': 'Fee Payment Overdue',
        'ABSENCE_ALERT': 'Absence Alert',
        'ANNOUNCEMENT_PUBLISHED': 'New Announcement',
        'HOMEWORK_POSTED': 'New Homework',
        'PASSWORD_RESET': 'Password Reset',
        'WELCOME_ENROLLMENT': 'Welcome!',
        'FEE_REMINDER_3DAYS': 'Fee Reminder',
        'FEE_REMINDER': 'Fee Reminder',
        'CUSTOM_ANNOUNCEMENT': 'Announcement',
    }
    return titles.get(event_type, event_type.replace('_', ' ').title())


def _build_message(event_type: str, template, context: dict) -> str:
    """Build notification message from template or defaults."""
    # If template has push_body, use it (it's short-form, good for in-app)
    if template and template.push_body:
        msg = template.push_body
        for key, val in context.items():
            msg = msg.replace(f'{{{{{key}}}}}', str(val))
        return msg

    amt = context.get('amount', '—')
    stu = context.get('student_name', 'your child')
    inv_no = context.get('invoice_number', '—')

    defaults = {
        'INVOICE_GENERATED': f"A new fee invoice of ₹{amt} has been generated for {stu}.",
        'PAYMENT_CONFIRMED': f"Payment of ₹{amt} for {stu} has been confirmed.",
        'PAYMENT_OVERDUE': f"Fee payment of ₹{amt} for {stu} is overdue.",
        'ABSENCE_ALERT': f"{context.get('student_name', 'Your child')} was marked absent on {context.get('date', 'today')}.",
        'ANNOUNCEMENT_PUBLISHED': f"New announcement: {context.get('title', 'Check the notice board')}.",
        'HOMEWORK_POSTED': (
            f"New homework: {context.get('homework_title', '').strip()} — "
            f"{context.get('subject', 'a subject')}, due {context.get('due_date', 'soon')}."
            if context.get('homework_title')
            else f"New homework in {context.get('subject', 'a subject')} — due {context.get('due_date', 'soon')}."
        ),
        'WELCOME_ENROLLMENT': f"Welcome! {context.get('student_name', 'Your child')} has been enrolled successfully.",
        'FEE_REMINDER_3DAYS': f"Reminder: Fee payment of ₹{amt} for {stu} is due in 3 days.",
        'FEE_REMINDER': (
            f"Fee reminder: Invoice {inv_no} for {stu} — ₹{amt} outstanding"
            + (f", due {context.get('due_date')}." if context.get('due_date') else '.')
        ),
    }
    if context.get('fee_kind') == 'admission':
        defaults['INVOICE_GENERATED'] = (
            f"Admission fee ({inv_no}) of ₹{amt} for {stu} is due — separate from annual school fees."
        )
        defaults['PAYMENT_CONFIRMED'] = (
            f"Admission fee payment of ₹{amt} for {stu} has been received. Thank you."
        )
        defaults['PAYMENT_OVERDUE'] = (
            f"Admission fee ({inv_no}) of ₹{amt} for {stu} is overdue."
        )
        defaults['FEE_REMINDER_3DAYS'] = (
            f"Reminder: Admission fee ({inv_no}) of ₹{amt} for {stu} is due in 3 days."
        )
        defaults['FEE_REMINDER'] = (
            f"Admission fee reminder: {inv_no} for {stu} — ₹{amt} outstanding."
        )
    if context.get('fee_kind') == 'transport':
        defaults['INVOICE_GENERATED'] = (
            f"A new transport fee invoice ({inv_no}) of ₹{amt} for {stu} is ready to pay."
        )
        defaults['PAYMENT_CONFIRMED'] = (
            f"Transport fee payment of ₹{amt} for {stu} has been received. Thank you."
        )
        defaults['PAYMENT_OVERDUE'] = (
            f"Transport fee ({inv_no}) of ₹{amt} for {stu} is overdue. Please pay at the earliest."
        )
        defaults['FEE_REMINDER_3DAYS'] = (
            f"Reminder: Transport fee ({inv_no}) of ₹{amt} for {stu} is due in 3 days."
        )
        defaults['FEE_REMINDER'] = (
            f"Transport fee reminder: {inv_no} for {stu} — ₹{amt} outstanding"
            + (f", due {context.get('due_date')}." if context.get('due_date') else '.')
        )

    return defaults.get(event_type, f"You have a new notification: {event_type}")
