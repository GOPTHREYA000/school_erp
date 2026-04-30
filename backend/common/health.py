"""
Health check endpoint for load balancers, App Platform, and uptime monitors.
Returns 200 if the app and database are healthy, 500 otherwise.
"""

import logging
from django.http import JsonResponse
from django.db import connection

logger = logging.getLogger(__name__)


def health_check(request):
    """
    Lightweight health check that verifies:
    1. Django app is running
    2. Database connection is alive

    Used by:
    - DigitalOcean App Platform health checks
    - Cloudflare load balancer
    - Uptime monitoring (e.g., BetterUptime, Pingdom)
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return JsonResponse({
            "status": "ok",
            "database": "connected",
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JsonResponse({
            "status": "error",
            "database": str(e),
        }, status=500)
