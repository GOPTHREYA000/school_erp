"""Set httpOnly JWT cookies + CSRF for cookie-based API auth."""

from django.conf import settings
from django.middleware.csrf import get_token


def set_auth_cookies(response, request, access: str, refresh: str) -> None:
    is_secure = not settings.DEBUG
    get_token(request)
    same = settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax')
    response.set_cookie(
        'access_token',
        access,
        max_age=3600,
        httponly=True,
        secure=is_secure,
        samesite=same,
    )
    response.set_cookie(
        'refresh_token',
        refresh,
        max_age=86400 * 7,
        httponly=True,
        secure=is_secure,
        samesite=same,
    )
