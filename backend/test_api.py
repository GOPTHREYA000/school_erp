import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.test import Client
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import User

c = Client(SERVER_NAME='localhost')
u = User.objects.get(id='ef9b8c2c-d1f9-42f7-922a-9d7fcd18edf5')
token = RefreshToken.for_user(u).access_token
c.cookies['access_token'] = str(token)

urls = [
    '/api/parent/children/22222960-a83f-492e-99f3-a470c958111d/attendance/',
    '/api/parent/children/22222960-a83f-492e-99f3-a470c958111d/fees/invoices/',
    '/api/parent/children/22222960-a83f-492e-99f3-a470c958111d/homework/',
]

for url in urls:
    res = c.get(url)
    print(f"{url} -> {res.status_code}")
    if res.status_code == 200:
        data = res.json().get('data', [])
        print(f"  Length: {len(data)}")

