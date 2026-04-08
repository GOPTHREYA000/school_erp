"""
In-app notification dispatcher for parent accounts.
Writes notifications to NotificationLog with channel='IN_APP'.
No external services (SMS/Email/WhatsApp) are used.
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

    # Construct the notification message
    message = _build_message(event_type, template, payload or {})

    log = NotificationLog.objects.create(
        tenant=tenant,
        branch=branch,
        event_type=event_type,
        recipient_user=recipient_user,
        recipient_email=recipient_user.email,
        channel='IN_APP',
        status='DELIVERED',
        payload={
            **(payload or {}),
            'message': message,
            'title': _event_title(event_type),
        },
        sent_at=timezone.now(),
    )

    logger.info(f"In-app notification created: {event_type} → {recipient_user.email}")
    return log


def dispatch_bulk_notifications(
    tenant,
    branch,
    event_type: str,
    recipient_users,
    payload: dict = None,
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
        )
        if result:
            results.append(result)
    return results


def _event_title(event_type: str) -> str:
    """Human-readable title for each event type."""
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

    # Default messages
    defaults = {
        'INVOICE_GENERATED': f"A new fee invoice of ₹{context.get('amount', '—')} has been generated for {context.get('student_name', 'your child')}.",
        'PAYMENT_CONFIRMED': f"Payment of ₹{context.get('amount', '—')} for {context.get('student_name', 'your child')} has been confirmed.",
        'PAYMENT_OVERDUE': f"Fee payment of ₹{context.get('amount', '—')} for {context.get('student_name', 'your child')} is overdue.",
        'ABSENCE_ALERT': f"{context.get('student_name', 'Your child')} was marked absent on {context.get('date', 'today')}.",
        'ANNOUNCEMENT_PUBLISHED': f"New announcement: {context.get('title', 'Check the notice board')}.",
        'HOMEWORK_POSTED': f"New homework in {context.get('subject', 'a subject')} — due {context.get('due_date', 'soon')}.",
        'WELCOME_ENROLLMENT': f"Welcome! {context.get('student_name', 'Your child')} has been enrolled successfully.",
        'FEE_REMINDER_3DAYS': f"Reminder: Fee payment of ₹{context.get('amount', '—')} for {context.get('student_name', 'your child')} is due in 3 days.",
    }
    return defaults.get(event_type, f"You have a new notification: {event_type}")
