"""
Razorpay client helpers. Used only when ONLINE_PAYMENTS_ENABLED and API keys are set.

Docs: https://razorpay.com/docs/api/orders/
      https://razorpay.com/docs/webhooks/validate-test/
"""
import hashlib
import hmac
import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def is_razorpay_ready() -> bool:
    """True when env flag is on and both key id + secret are configured."""
    return bool(
        getattr(settings, 'ONLINE_PAYMENTS_ENABLED', False)
        and settings.RAZORPAY_KEY_ID
        and settings.RAZORPAY_KEY_SECRET
    )


def get_publishable_key_id() -> str:
    return settings.RAZORPAY_KEY_ID or ''


def _client():
    import razorpay

    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


def create_order(*, amount_paise: int, receipt: str, notes: dict) -> dict:
    """
    Create a Razorpay order. amount_paise must be a positive integer (INR × 100).
    receipt: unique id per order (max 40 chars per Razorpay).
    """
    client = _client()
    receipt = (receipt or '')[:40]
    clean_notes = {str(k)[:40]: str(v)[:255] for k, v in (notes or {}).items()}
    return client.order.create(
        {
            'amount': int(amount_paise),
            'currency': 'INR',
            'receipt': receipt,
            'notes': clean_notes,
        }
    )


def verify_webhook_signature(body: bytes, signature_header: str) -> bool:
    """Validate X-Razorpay-Signature for webhook raw body."""
    secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', '') or ''
    if not secret or not signature_header:
        return False
    digest = hmac.new(secret.encode('utf-8'), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(digest, signature_header):
        logger.warning('Razorpay webhook signature mismatch')
        return False
    return True
