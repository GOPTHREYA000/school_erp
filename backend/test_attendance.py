import requests

url_login = "http://localhost:8000/api/auth/login/"
data = {"email": "test_telugu@gmail.com", "password": "Password123!"}
session = requests.Session()
r = session.post(url_login, json=data)

res = session.get("http://localhost:8000/api/attendance/?date=2026-04-11")
print(res.json())
