import requests
import json

url = 'http://localhost:8000/api/transport/routes/'
data = {
    "name": "Route A",
    "start_point": "school",
    "end_point": "school",
    "distance_km": 10,
    "stops": "2",
    "branch_id": "ff0d4ad2-f701-4f50-b88b-8acf225070a0",
    "is_active": True
}
cookies = {"sessionid": "mock", "access_token": "mock"} # Needs valid token, actually I can just look at the serializer!
