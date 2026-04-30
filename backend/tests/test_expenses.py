import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from expenses.views import ExpenseViewSet
from django.contrib.auth import get_user_model
from rest_framework.request import Request
from django.test import RequestFactory

User = get_user_model()
u = User.objects.filter(role='ACCOUNTANT').first()
factory = RequestFactory()
drf_request = Request(factory.get('/api/expenses/?status='))
drf_request.user = u

view = ExpenseViewSet()
view.request = drf_request
view.format_kwarg = None
res = view.list(drf_request)
print("Type of res.data:", type(res.data))
if isinstance(res.data, dict):
    print("Keys in res.data:", res.data.keys())
    if 'results' in res.data:
        print("Number of results:", len(res.data['results']))
