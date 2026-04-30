import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from expenses.views import ExpenseViewSet
from django.contrib.auth import get_user_model
User = get_user_model()

u = User.objects.filter(role='ACCOUNTANT').first()
factory = RequestFactory()
request = factory.get('/api/expenses/?status=')
request.user = u
view = ExpenseViewSet()
view.request = request
view.format_kwarg = None

qs = view.get_queryset()
print("Accountant found?", u.email)
print("Count returned:", qs.count())
print("Values:", list(qs.values('title', 'amount', 'status')))
