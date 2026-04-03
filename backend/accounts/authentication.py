from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import UntypedToken


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads the access token from httpOnly cookies.
    Does NOT fall back to Authorization header — this preserves httpOnly security.
    """
    def authenticate(self, request):
        raw_token = request.COOKIES.get('access_token')
        if raw_token is None:
            # No cookie = not authenticated via this backend
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except (InvalidToken, TokenError):
            return None

