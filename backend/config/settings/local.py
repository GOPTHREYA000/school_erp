"""
Local development settings.
Usage: DJANGO_SETTINGS_MODULE=config.settings.local
"""

from .base import *  # noqa: F401,F403

# ─── Security (Dev Only) ───────────────────────────────────────
SECRET_KEY = 'django-insecure-LOCAL-DEV-ONLY-NOT-FOR-PRODUCTION'
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']


# ─── Database ───────────────────────────────────────────────────
# SQLite for zero-config local development.
# To use local Postgres, set DATABASE_URL env var.
import dj_database_url

DATABASES = {
    'default': dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        conn_health_checks=True,
    )
}


# ─── JWT Cookie (not secure in dev — no HTTPS) ─────────────────
SIMPLE_JWT['AUTH_COOKIE_SECURE'] = False


# ─── File-based logging for local dev ──────────────────────────
LOG_DIR = BASE_DIR / 'logs'
LOG_DIR.mkdir(exist_ok=True)

LOGGING['handlers']['file'] = {
    'class': 'logging.FileHandler',
    'filename': LOG_DIR / 'erp.log',
    'formatter': 'verbose',
}
for logger_name in ['accounts', 'fees', 'students', 'tenants']:
    LOGGING['loggers'][logger_name]['handlers'] = ['console', 'file']
