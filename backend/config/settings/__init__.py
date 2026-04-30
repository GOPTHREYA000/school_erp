"""
Settings package for School ERP.

BACKWARD COMPATIBILITY: When DJANGO_SETTINGS_MODULE=config.settings (the default
in manage.py/wsgi.py/celery.py), this __init__.py imports local settings so that
existing dev workflows continue to work without any changes.

For production: set DJANGO_SETTINGS_MODULE=config.settings.production
"""

from config.settings.local import *  # noqa: F401,F403
