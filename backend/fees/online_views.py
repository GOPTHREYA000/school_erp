"""
HTTP API for Razorpay (optional). Safe defaults: disabled until env + keys are set.
"""
import logging

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError, PermissionDenied

from .gateways import razorpay_gateway as rz
from .online_payment_service import create_razorpay_order_for_invoice, handle_razorpay_webhook_payload

logger = logging.getLogger(__name__)


class OnlinePaymentConfigView(APIView):
    """Frontend feature flag + publishable key for Razorpay Checkout."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        ready = rz.is_razorpay_ready()
        return Response(
            {
                'success': True,
                'data': {
                    'online_payments_enabled': ready,
                    'key_id': rz.get_publishable_key_id() if ready else None,
                },
            }
        )


class CreateRazorpayOrderView(APIView):
    """Create Razorpay order + PENDING Payment. Returns 503 when not configured."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not rz.is_razorpay_ready():
            return Response(
                {
                    'success': False,
                    'error': {
                        'code': 'ONLINE_PAYMENTS_DISABLED',
                        'detail': (
                            'Online payments are off. Set ONLINE_PAYMENTS_ENABLED=true '
                            'and RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET when you are ready.'
                        ),
                    },
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        invoice_id = request.data.get('invoice_id')
        if not invoice_id:
            return Response(
                {'success': False, 'error': {'detail': 'invoice_id is required.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        idempotency_key = request.data.get('idempotency_key')

        try:
            data = create_razorpay_order_for_invoice(
                request.user,
                invoice_id,
                idempotency_key=idempotency_key,
            )
        except PermissionDenied as e:
            return Response(
                {'success': False, 'error': {'detail': str(e)}},
                status=status.HTTP_403_FORBIDDEN,
            )
        except ValidationError as e:
            return Response(
                {'success': False, 'error': e.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({'success': True, 'data': data}, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class RazorpayWebhookView(APIView):
    """
    Razorpay server-to-server webhooks. CSRF-exempt; verify HMAC when RAZORPAY_WEBHOOK_SECRET is set.
    Configure URL in Dashboard: POST /api/v1/fees/payments/webhooks/razorpay/
    """

    permission_classes = [AllowAny]
    authentication_classes = []  # Razorpay does not send JWT cookies

    def post(self, request):
        signature = request.META.get('HTTP_X_RAZORPAY_SIGNATURE', '')
        body = request.body

        try:
            result = handle_razorpay_webhook_payload(body, signature)
        except Exception:
            logger.exception('Razorpay webhook handler error')
            return Response(
                {'received': False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(result, status=status.HTTP_200_OK)
