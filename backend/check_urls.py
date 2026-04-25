import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.urls import resolve

try:
    match = resolve('/api/expenses/categories/')
    print("Match 1:", match.func.__name__)
except Exception as e:
    print("No Match 1:", e)

try:
    match = resolve('/api/expenses/')
    print("Match 2:", match.func.__name__)
except Exception as e:
    print("No Match 2:", e)

