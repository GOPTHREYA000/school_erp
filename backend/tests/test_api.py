import requests
import json

# Login
res = requests.post('http://127.0.0.1:8000/api/auth/login/', json={'email': 'abhigroup@gmail.com', 'password': 'password123'})
token = res.json().get('access_token') or res.json().get('access') # It sets cookie usually

session = requests.Session()
if res.cookies:
    session.cookies.update(res.cookies)

req = session.get('http://127.0.0.1:8000/api/expenses/categories/')
print(req.status_code)
print(req.text)
if req.status_code == 200:
    for c in req.json().get('results', req.json()):
        print(c.get('name'))
