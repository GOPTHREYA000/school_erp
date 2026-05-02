import logging

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer
from .throttles import PasswordResetRateThrottle

logger = logging.getLogger(__name__)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        ser = PasswordResetRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data['email'].strip().lower()
        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(str(user.pk)))
            token = default_token_generator.make_token(user)
            base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3000').rstrip('/')
            path = getattr(settings, 'FRONTEND_PASSWORD_RESET_PATH', '/reset-password')
            if not path.startswith('/'):
                path = '/' + path
            link = f'{base}{path}?uid={uid}&token={token}'
            subject = 'Password reset'
            body = (
                'You requested a password reset for your school ERP account.\n\n'
                f'Use this link to choose a new password (valid for a limited time):\n{link}\n\n'
                'If you did not request this, you can ignore this email.'
            )
            try:
                send_mail(
                    subject,
                    body,
                    getattr(settings, 'DEFAULT_FROM_EMAIL', 'webmaster@localhost'),
                    [user.email],
                    fail_silently=False,
                )
            except Exception:
                logger.exception('Password reset email failed for user_id=%s', user.pk)
        return Response(
            {
                'success': True,
                'message': 'If an account exists for that email, password reset instructions have been sent.',
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        ser = PasswordResetConfirmSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        uid_b64 = ser.validated_data['uid']
        token = ser.validated_data['token']
        new_password = ser.validated_data['new_password']
        try:
            uid = force_str(urlsafe_base64_decode(uid_b64))
            user = User.objects.get(pk=uid, is_active=True)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response(
                {'success': False, 'detail': 'Invalid or expired reset link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not default_token_generator.check_token(user, token):
            return Response(
                {'success': False, 'detail': 'Invalid or expired reset link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            validate_password(new_password, user)
        except DjangoValidationError as e:
            return Response(
                {'success': False, 'detail': list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(new_password)
        user.must_change_password = False
        user.save(update_fields=['password', 'must_change_password'])
        return Response(
            {'success': True, 'message': 'Password has been reset. You can sign in with your new password.'},
            status=status.HTTP_200_OK,
        )
