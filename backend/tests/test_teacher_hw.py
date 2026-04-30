import requests

url_login = "http://localhost:8000/api/auth/login/"
data = {"email": "test_telugu@gmail.com", "password": "Password123!"}
session = requests.Session()
r = session.post(url_login, json=data)

if r.status_code == 200:
    print("Login success")
    classes_req = session.get("http://localhost:8000/api/classes/?assigned_only=true")
    print("Classes:", classes_req.json())
    subjects_req = session.get("http://localhost:8000/api/subjects/?assigned_only=true")
    print("Subjects:", subjects_req.status_code, subjects_req.json() if subjects_req.status_code == 200 else subjects_req.text)
else:
    print("Login failed", r.status_code, r.text)
