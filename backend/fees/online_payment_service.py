"""
Online fee payment orchestration (Razorpay). No-op at runtime until ONLINE_PAYMENTS_ENABLED + keys are set.
"""
from __future__ import annotations

import json
import logging
import uuid
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from accounts.models import AuditLog
from accounts.permissions import has_min_role
from accounts.utils import log_audit_action
from expenses.models import TransactionLog
from students.models import ParentStudentRelation

from .gateways import razorpay_gateway as rz
from .models import FeeInvoice, Payment

logger = logging.getLogger(__name__)


def _assert_can_pay_invoice(user, invoice: FeeInvoice) -> None:
    if user.role == 'PARENT':
        if not ParentStudentRelation.objects.filter(
            parent=user, student_id=invoice.student_id
        ).exists():
            raise PermissionDenied('You cannot pay this invoice.')
        return
    if user.role == 'SUPER_ADMIN':
        return
    if not user.tenant or invoice.tenant_id != user.tenant_id:
        raise PermissionDenied('You cannot pay this invoice.')
    if not has_min_role(user, 'ACCOUNTANT'):
        raise PermissionDenied('Only finance staff or the student parent can pay online.')


def create_razorpay_order_for_invoice(user, invoice_id, idempotency_key: str | None = None):
    """
    Create a Razorpay order and a PENDING Payment row. Caller must verify rz.is_razorpay_ready().
    """
    if not idempotency_key:
        idempotency_key = str(uuid.uuid4())

    with transaction.atomic():
        inv_qs = FeeInvoice.objects.select_for_update().filter(id=invoice_id)
        if user.tenant:
            inv_qs = inv_qs.filter(tenant=user.tenant)
        elif user.role != 'SUPER_ADMIN':
            raise PermissionDenied('Invoice not found.')
        try:
            invoice = inv_qs.get()
        except FeeInvoice.DoesNotExist:
            raise ValidationError({'invoice_id': 'Invoice not found.'})

        _assert_can_pay_invoice(user, invoice)

        if invoice.status in ('PAID', 'CANCELLED', 'WAIVED'):
            raise ValidationError({'invoice_id': f'Invoice is {invoice.status} and cannot be paid.'})

        amount = invoice.outstanding_amount
        if amount is None or amount <= Decimal('0'):
            raise ValidationError({'invoice_id': 'No outstanding balance on this invoice.'})

        existing = (
            Payment.objects.select_for_update()
            .filter(
                tenant=invoice.tenant,
                idempotency_key=idempotency_key,
                status='PENDING',
            )
            .first()
        )
        if existing and existing.razorpay_order_id:
            amount_paise = int(amount * 100)
            return {
                'payment_id': str(existing.id),
                'order_id': existing.razorpay_order_id,
                'amount': amount_paise,
                'currency': 'INR',
                'key_id': rz.get_publishable_key_id(),
                'idempotency_key': idempotency_key,
                'reused': True,
            }

        if existing:
            payment = existing
        else:
            payment = Payment.objects.create(
                tenant=invoice.tenant,
                invoice=invoice,
                student=invoice.student,
                branch=invoice.branch,
                amount=amount,
                payment_mode='ONLINE',
                payment_date=timezone.now().date(),
                status='PENDING',
                idempotency_key=idempotency_key,
                collected_by=user if user.is_authenticated else None,
            )

        receipt = str(payment.id).replace('-', '')[:40]
        amount_paise = int(amount * 100)
        notes = {
            'payment_id': str(payment.id),
            'invoice_id': str(invoice.id),
            'student_id': str(invoice.student_id),
            'tenant_id': str(invoice.tenant_id),
        }

        try:
            order = rz.create_order(
                amount_paise=amount_paise,
                receipt=receipt,
                notes=notes,
            )
        except Exception:
            logger.exception('Razorpay order.create failed for payment %s', payment.id)
            payment.status = 'FAILED'
            payment.save(update_fields=['status', 'updated_at'])
            raise ValidationError({'detail': 'Could not create payment order. Try again later.'})

        payment.razorpay_order_id = order['id']
        payment.save(update_fields=['razorpay_order_id', 'updated_at'])

    log_audit_action(
        user,
        'CREATE_RAZORPAY_ORDER',
        'Payment',
        payment.id,
        details={'invoice_number': invoice.invoice_number, 'order_id': order['id']},
        tenant=invoice.tenant,
    )

    return {
        'payment_id': str(payment.id),
        'order_id': order['id'],
        'amount': amount_paise,
        'currency': order.get('currency', 'INR'),
        'key_id': rz.get_publishable_key_id(),
        'idempotency_key': idempotency_key,
        'reused': False,
    }


def finalize_payment_from_webhook(*, order_id: str, razorpay_payment_id: str, amount_paise: int) -> bool:
    """
    Mark PENDING payment COMPLETED after Razorpay payment.captured. Idempotent.
    Returns True if processed or already completed.
    """
    with transaction.atomic():
        try:
            payment = Payment.objects.select_for_update().get(razorpay_order_id=order_id)
        except Payment.DoesNotExist:
            logger.warning('Razorpay webhook: no Payment for order_id=%s', order_id)
            return False

        if payment.status == 'COMPLETED':
            return True

        if payment.status != 'PENDING':
            logger.warning(
                'Razorpay webhook: payment %s in status %s, skipping',
                payment.id,
                payment.status,
            )
            return False

        expected_paise = int(payment.amount * 100)
        if int(amount_paise) != expected_paise:
            logger.error(
                'Razorpay webhook: amount mismatch payment=%s expected_paise=%s got=%s',
                payment.id,
                expected_paise,
                amount_paise,
            )
            return False

        invoice = FeeInvoice.objects.select_for_update().get(pk=payment.invoice_id)

        if razorpay_payment_id:
            exists = (
                Payment.objects.filter(razorpay_payment_id=razorpay_payment_id)
                .exclude(id=payment.id)
                .exists()
            )
            if exists:
                logger.warning('Duplicate razorpay_payment_id %s', razorpay_payment_id)
                return True

        payment.razorpay_payment_id = razorpay_payment_id
        payment.status = 'COMPLETED'
        payment.payment_date = timezone.now().date()
        payment.save(
            update_fields=[
                'razorpay_payment_id',
                'status',
                'payment_date',
                'updated_at',
            ]
        )

        invoice.paid_amount += payment.amount
        invoice.outstanding_amount = max(
            invoice.net_amount - invoice.paid_amount,
            Decimal('0.00'),
        )
        if invoice.outstanding_amount <= 0:
            invoice.status = 'PAID'
            invoice.outstanding_amount = Decimal('0.00')
        else:
            invoice.status = 'PARTIALLY_PAID'
        invoice.save()

        TransactionLog.objects.create(
            tenant=invoice.tenant,
            branch=invoice.branch,
            transaction_type='INCOME',
            category='Fee Payment (Online)',
            reference_model='Payment',
            reference_id=payment.id,
            amount=payment.amount,
            description=f"Online payment for {invoice.invoice_number}",
            transaction_date=payment.payment_date,
        )

        payment.receipt_url = f"/api/v1/templates/generate/receipt/{payment.id}/"
        payment.save(update_fields=['receipt_url', 'updated_at'])

        AuditLog.objects.create(
            tenant=payment.tenant,
            user=None,
            action='ONLINE_PAYMENT_CAPTURED',
            model_name='Payment',
            record_id=payment.id,
            details={
                'razorpay_payment_id': razorpay_payment_id,
                'invoice_number': invoice.invoice_number,
            },
        )

    return True


def handle_razorpay_webhook_payload(body: bytes, signature_header: str) -> dict:
    """
    Process webhook body. When online payments are disabled, acknowledges without processing.
    """
    from django.conf import settings as django_settings

    if not rz.is_razorpay_ready():
        logger.info('Razorpay webhook ignored (online payments not configured)')
        return {'received': True, 'processed': False, 'reason': 'online_payments_disabled'}

    secret = getattr(django_settings, 'RAZORPAY_WEBHOOK_SECRET', '') or ''
    if not secret:
        if not django_settings.DEBUG:
            logger.error('Razorpay webhook refused: set RAZORPAY_WEBHOOK_SECRET in production')
            return {'received': True, 'processed': False, 'reason': 'webhook_secret_missing'}
        logger.warning('Razorpay webhook: DEBUG mode — processing without signature verification')
    elif not rz.verify_webhook_signature(body, signature_header or ''):
        return {'received': True, 'processed': False, 'reason': 'invalid_signature'}

    try:
        payload = json.loads(body.decode('utf-8'))
    except (UnicodeDecodeError, json.JSONDecodeError):
        logger.warning('Razorpay webhook: invalid JSON')
        return {'received': True, 'processed': False, 'reason': 'bad_json'}

    event = payload.get('event')
    if event != 'payment.captured':
        return {'received': True, 'processed': False, 'reason': f'ignored_event:{event}'}

    entity = (payload.get('payload') or {}).get('payment', {}).get('entity') or {}
    order_id = entity.get('order_id')
    pay_id = entity.get('id')
    amount = entity.get('amount')
    if not order_id or not pay_id or amount is None:
        logger.warning('Razorpay webhook: missing fields in payment entity')
        return {'received': True, 'processed': False, 'reason': 'incomplete_payload'}

    ok = finalize_payment_from_webhook(
        order_id=order_id,
        razorpay_payment_id=pay_id,
        amount_paise=int(amount),
    )
    return {'received': True, 'processed': ok}
