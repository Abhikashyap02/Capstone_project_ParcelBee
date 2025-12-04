import jwt
import json
from datetime import datetime, timedelta
from django.conf import settings
from django.http import JsonResponse
from functools import wraps
from core.models import User
import math
import requests


def generate_jwt(user):
    """Generate JWT token for authenticated user"""
    payload = {
        'user_id': user.id,
        'email': user.email,
        'role': user.role,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return token


def decode_jwt(token):
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def json_response(data, status=200):
    """Helper function to return JSON response"""
    return JsonResponse(data, status=status, safe=False)


def auth_required(roles=None):
    """Decorator to protect views with JWT authentication"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            auth_header = request.headers.get('Authorization', '')
            
            if not auth_header.startswith('Bearer '):
                return json_response({'error': 'No token provided'}, status=401)
            
            token = auth_header.split(' ')[1]
            payload = decode_jwt(token)
            
            if not payload:
                return json_response({'error': 'Invalid or expired token'}, status=401)
            
            try:
                user = User.objects.get(id=payload['user_id'])
                request.user = user
            except User.DoesNotExist:
                return json_response({'error': 'User not found'}, status=401)
            
            # Check role permissions
            if roles and user.role not in roles:
                return json_response({'error': 'Access denied'}, status=403)
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def get_json_data(request):
    """Parse JSON data from request body"""
    try:
        return json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return None
    


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    def to_rad(deg): return deg * math.pi / 180.0
    dlat = to_rad(lat2 - lat1)
    dlon = to_rad(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(to_rad(lat1)) * math.cos(to_rad(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def geocode_nominatim(address):
    """
    Simple Nominatim forward geocode. Returns (lat, lon) floats.
    """
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": address, "format": "json", "limit": 1}
    headers = {"User-Agent": "ParcelBee/1.0 (+contact)"}  # set a UA
    resp = requests.get(url, params=params, headers=headers, timeout=8)
    resp.raise_for_status()
    data = resp.json()
    if not data:
        raise ValueError("No geocoding result for: " + address)
    return float(data[0]["lat"]), float(data[0]["lon"])