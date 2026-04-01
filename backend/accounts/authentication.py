from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import UntypedToken


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads the access token from httpOnly cookies
    instead of the Authorization header.
    """
    def authenticate(self, request):
        # First try the cookie
        raw_token = request.COOKIES.get('access_token')
        if raw_token is None:
            # Fall back to header-based auth
            return super().authenticate(request)

        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except (InvalidToken, TokenError):
            return None
