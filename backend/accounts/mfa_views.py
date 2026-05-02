import logging

import pyotp
from django.conf import settings
from django.core import signing
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .jwt_cookies import set_auth_cookies
from .models import User
from .throttles import LoginRateThrottle

logger = logging.getLogger(__name__)

MFA_SIGN_SALT = 'mfa-login-challenge'


def _totp_for_user(user: User):
    if not user.mfa_totp_secret:
        return None
    return pyotp.TOTP(user.mfa_totp_secret)


class MfaVerifyView(APIView):
    """Complete login after password step when MFA is enabled."""

    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        challenge = request.data.get('mfa_challenge')
        code = (request.data.get('code') or '').replace(' ', '')
        if not challenge or not code:
            return Response({'error': 'mfa_challenge and code are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            max_age = getattr(settings, 'MFA_CHALLENGE_MAX_AGE', 600)
            uid = signing.loads(challenge, salt=MFA_SIGN_SALT, max_age=max_age)['u']
        except signing.BadSignature:
            return Response({'error': 'Invalid or expired challenge. Sign in again.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(pk=uid)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not user.mfa_enabled or not user.mfa_totp_secret:
            return Response({'error': 'MFA is not active for this account.'}, status=status.HTTP_400_BAD_REQUEST)

        totp = _totp_for_user(user)
        if not totp or not totp.verify(code, valid_window=1):
            logger.warning('MFA verify failed for user %s', user.email)
            return Response({'error': 'Invalid authentication code.'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        response = Response(
            {
                'success': True,
                'message': 'Login successful',
                'must_change_password': getattr(user, 'must_change_password', False),
                'csrf_token': get_token(request),
            },
            status=status.HTTP_200_OK,
        )
        set_auth_cookies(response, request, str(refresh.access_token), str(refresh))
        return response


class MfaSetupView(APIView):
    """Begin MFA enrollment: create or return TOTP secret (not enabled until confirm)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.mfa_enabled:
            return Response({'success': True, 'mfa_enabled': True})
        issuer = getattr(settings, 'MFA_ISSUER_NAME', 'School ERP')
        if not user.mfa_totp_secret:
            user.mfa_totp_secret = pyotp.random_base32()
            user.save(update_fields=['mfa_totp_secret'])
        totp = pyotp.TOTP(user.mfa_totp_secret)
        uri = totp.provisioning_uri(name=user.email, issuer_name=issuer)
        return Response(
            {
                'success': True,
                'mfa_enabled': False,
                'provisioning_uri': uri,
                'secret': user.mfa_totp_secret,
            }
        )


class MfaConfirmView(APIView):
    """Verify a TOTP code and turn MFA on."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = (request.data.get('code') or '').replace(' ', '')
        if not code:
            return Response({'error': 'code is required.'}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        if not user.mfa_totp_secret:
            return Response({'error': 'Run MFA setup first.'}, status=status.HTTP_400_BAD_REQUEST)
        totp = _totp_for_user(user)
        if not totp or not totp.verify(code, valid_window=1):
            return Response({'error': 'Invalid code.'}, status=status.HTTP_400_BAD_REQUEST)
        user.mfa_enabled = True
        user.save(update_fields=['mfa_enabled'])
        return Response({'success': True, 'mfa_enabled': True})


class MfaDisableView(APIView):
    """Turn MFA off after password (and TOTP) verification."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        password = request.data.get('password') or ''
        code = (request.data.get('code') or '').replace(' ', '')
        user = request.user
        if not user.check_password(password):
            return Response({'error': 'Invalid password.'}, status=status.HTTP_400_BAD_REQUEST)
        if user.mfa_enabled:
            totp = _totp_for_user(user)
            if not totp or not totp.verify(code, valid_window=1):
                return Response({'error': 'Invalid authentication code.'}, status=status.HTTP_400_BAD_REQUEST)
        user.mfa_enabled = False
        user.mfa_totp_secret = ''
        user.save(update_fields=['mfa_enabled', 'mfa_totp_secret'])
        return Response({'success': True, 'mfa_enabled': False})
