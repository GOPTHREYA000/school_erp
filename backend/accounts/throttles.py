"""
Login-specific rate throttle — prevents brute-force attacks.
Limits login attempts to 5 per 5 minutes per IP address.
"""
from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """Throttle login attempts by IP to prevent brute-force password guessing."""
    scope = 'login'


class PasswordResetRateThrottle(AnonRateThrottle):
    scope = 'password_reset'
