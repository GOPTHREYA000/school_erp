import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fees.models import FeeInvoice
from django.test import RequestFactory
from fees.views import PaymentViewSet
from accounts.models import User
from rest_framework.test import force_authenticate

user = User.objects.filter(role='SUPER_ADMIN').first()
invoice = FeeInvoice.objects.filter(outstanding_amount__gt=0).first()

factory = RequestFactory()
request = factory.post('/api/fees/payments/offline/', data={
    "invoice_id": str(invoice.id),
    "amount": "5000.00",
    "payment_mode": "CASH",
    "payment_date": "2026-04-03"
}, content_type='application/json')

force_authenticate(request, user=user)

view = PaymentViewSet.as_view({'post': 'record_offline'})

try:
    response = view(request)
    print("Response Status:", response.status_code)
    print("Response Data:", response.data)
except Exception as e:
    import traceback
    traceback.print_exc()

