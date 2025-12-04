from django.shortcuts import render

# Create your views here.
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate
from django.utils import timezone
from core.models import User, DeliveryRequest
from core.utils import generate_jwt, json_response, get_json_data, auth_required
from decimal import Decimal

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

from .serializers import PriceEstimateSerializer
from .utils import geocode_nominatim, haversine_km
import json

@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    """Register a new user (customer or partner)"""
    data = get_json_data(request)
    
    if not data:
        return json_response({'error': 'Invalid JSON'}, status=400)
    
    required_fields = ['name', 'email', 'password', 'role']
    for field in required_fields:
        if field not in data:
            return json_response({'error': f'{field} is required'}, status=400)
    
    if data['role'] not in ['customer', 'partner']:
        return json_response({'error': 'Role must be customer or partner'}, status=400)
    
    if User.objects.filter(email=data['email']).exists():
        return json_response({'error': 'Email already registered'}, status=400)
    
    try:
        user = User.objects.create_user(
            email=data['email'],
            password=data['password'],
            name=data['name'],
            role=data['role'],
            phone=data.get('phone', '')
        )
        
        token = generate_jwt(user)
        
        return json_response({
            'message': 'Registration successful',
            'token': token,
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role
            }
        }, status=201)
    except Exception as e:
        return json_response({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    """Login user and return JWT token"""
    data = get_json_data(request)
    
    if not data:
        return json_response({'error': 'Invalid JSON'}, status=400)
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return json_response({'error': 'Email and password required'}, status=400)
    
    try:
        user = User.objects.get(email=email)
        if user.check_password(password):
            token = generate_jwt(user)
            return json_response({
                'message': 'Login successful',
                'token': token,
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'role': user.role
                }
            })
        else:
            return json_response({'error': 'Invalid credentials'}, status=401)
    except User.DoesNotExist:
        return json_response({'error': 'Invalid credentials'}, status=401)


@csrf_exempt
@require_http_methods(["POST"])
@auth_required(roles=['customer'])
def create_delivery(request):
    """Create a new delivery request (customer only)"""
    data = get_json_data(request)
    
    if not data:
        return json_response({'error': 'Invalid JSON'}, status=400)
    
    required_fields = ['pickup_address', 'drop_address', 'description', 'weight']
    for field in required_fields:
        if field not in data:
            return json_response({'error': f'{field} is required'}, status=400)
    
    try:
        delivery = DeliveryRequest.objects.create(
            customer=request.user,
            pickup_address=data['pickup_address'],
            drop_address=data['drop_address'],
            pickup_lat=data.get('pickup_lat'),
            pickup_lng=data.get('pickup_lng'),
            drop_lat=data.get('drop_lat'),
            drop_lng=data.get('drop_lng'),
            description=data['description'],
            weight=Decimal(str(data['weight'])),
            estimated_price=data.get('estimated_price'),
            status='pending'
        )
        
        return json_response({
            'message': 'Delivery request created successfully',
            'delivery': {
                'id': delivery.id,
                'pickup_address': delivery.pickup_address,
                'drop_address': delivery.drop_address,
                'description': delivery.description,
                'weight': float(delivery.weight),
                'status': delivery.status,
                'created_at': delivery.created_at.isoformat()
            }
        }, status=201)
    except Exception as e:
        return json_response({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
@auth_required()
def list_deliveries(request):
    """List deliveries based on user role"""
    user = request.user
    
    if user.role == 'customer':
        # Show customer's own deliveries
        deliveries = DeliveryRequest.objects.filter(customer=user)
    elif user.role == 'partner':
        # Show available deliveries or partner's accepted deliveries
        status_filter = request.GET.get('status', 'all')
        if status_filter == 'available':
            deliveries = DeliveryRequest.objects.filter(status='pending', partner__isnull=True)
        elif status_filter == 'my':
            deliveries = DeliveryRequest.objects.filter(partner=user)
        else:
            deliveries = DeliveryRequest.objects.filter(partner=user) | DeliveryRequest.objects.filter(status='pending', partner__isnull=True)
    elif user.role == 'admin':
        # Admin sees all deliveries
        deliveries = DeliveryRequest.objects.all()
    else:
        deliveries = DeliveryRequest.objects.none()
    
    delivery_list = []
    for delivery in deliveries:
        delivery_list.append({
            'id': delivery.id,
            'customer_name': delivery.customer.name,
            'partner_name': delivery.partner.name if delivery.partner else None,
            'pickup_address': delivery.pickup_address,
            'drop_address': delivery.drop_address,
            'description': delivery.description,
            'weight': float(delivery.weight),
            'estimated_price': float(delivery.estimated_price) if delivery.estimated_price else None,
            'status': delivery.status,
            'created_at': delivery.created_at.isoformat(),
            'updated_at': delivery.updated_at.isoformat()
        })
    
    return json_response({
        'count': len(delivery_list),
        'deliveries': delivery_list
    })


@csrf_exempt
@require_http_methods(["GET"])
@auth_required()
def get_delivery_detail(request, delivery_id):
    """Get details of a specific delivery"""
    try:
        delivery = DeliveryRequest.objects.get(id=delivery_id)
        
        # Check permissions
        user = request.user
        if user.role == 'customer' and delivery.customer != user:
            return json_response({'error': 'Access denied'}, status=403)
        elif user.role == 'partner' and delivery.partner != user and delivery.status != 'pending':
            return json_response({'error': 'Access denied'}, status=403)
        
        return json_response({
            'id': delivery.id,
            'customer': {
                'id': delivery.customer.id,
                'name': delivery.customer.name,
                'email': delivery.customer.email,
                'phone': delivery.customer.phone
            },
            'partner': {
                'id': delivery.partner.id,
                'name': delivery.partner.name,
                'email': delivery.partner.email,
                'phone': delivery.partner.phone
            } if delivery.partner else None,
            'pickup_address': delivery.pickup_address,
            'drop_address': delivery.drop_address,
            'pickup_lat': float(delivery.pickup_lat) if delivery.pickup_lat else None,
            'pickup_lng': float(delivery.pickup_lng) if delivery.pickup_lng else None,
            'drop_lat': float(delivery.drop_lat) if delivery.drop_lat else None,
            'drop_lng': float(delivery.drop_lng) if delivery.drop_lng else None,
            'description': delivery.description,
            'weight': float(delivery.weight),
            'estimated_price': float(delivery.estimated_price) if delivery.estimated_price else None,
            'status': delivery.status,
            'created_at': delivery.created_at.isoformat(),
            'updated_at': delivery.updated_at.isoformat(),
            'accepted_at': delivery.accepted_at.isoformat() if delivery.accepted_at else None,
            'delivered_at': delivery.delivered_at.isoformat() if delivery.delivered_at else None
        })
    except DeliveryRequest.DoesNotExist:
        return json_response({'error': 'Delivery not found'}, status=404)


@csrf_exempt
@require_http_methods(["POST"])
@auth_required(roles=['partner'])
def accept_delivery(request, delivery_id):
    """Partner accepts a delivery request"""
    try:
        delivery = DeliveryRequest.objects.get(id=delivery_id)
        
        if delivery.status != 'pending':
            return json_response({'error': 'Delivery is not available'}, status=400)
        
        if delivery.partner is not None:
            return json_response({'error': 'Delivery already accepted by another partner'}, status=400)
        
        delivery.partner = request.user
        delivery.status = 'accepted'
        delivery.accepted_at = timezone.now()
        delivery.save()
        
        return json_response({
            'message': 'Delivery accepted successfully',
            'delivery': {
                'id': delivery.id,
                'status': delivery.status,
                'accepted_at': delivery.accepted_at.isoformat()
            }
        })
    except DeliveryRequest.DoesNotExist:
        return json_response({'error': 'Delivery not found'}, status=404)


@csrf_exempt
@require_http_methods(["PUT", "PATCH"])
@auth_required(roles=['partner'])
def update_delivery_status(request, delivery_id):
    """Update delivery status (partner only)"""
    data = get_json_data(request)
    
    if not data or 'status' not in data:
        return json_response({'error': 'Status is required'}, status=400)
    
    new_status = data['status']
    valid_statuses = ['accepted', 'in_transit', 'delivered', 'cancelled']
    
    if new_status not in valid_statuses:
        return json_response({'error': 'Invalid status'}, status=400)
    
    try:
        delivery = DeliveryRequest.objects.get(id=delivery_id)
        
        if delivery.partner != request.user:
            return json_response({'error': 'Access denied'}, status=403)
        
        delivery.status = new_status
        if new_status == 'delivered':
            delivery.delivered_at = timezone.now()
        delivery.save()
        
        return json_response({
            'message': 'Status updated successfully',
            'delivery': {
                'id': delivery.id,
                'status': delivery.status,
                'updated_at': delivery.updated_at.isoformat()
            }
        })
    except DeliveryRequest.DoesNotExist:
        return json_response({'error': 'Delivery not found'}, status=404)


@csrf_exempt
@require_http_methods(["GET"])
@auth_required(roles=['admin'])
def admin_overview(request):
    """Admin dashboard overview with statistics"""
    total_users = User.objects.count()
    total_customers = User.objects.filter(role='customer').count()
    total_partners = User.objects.filter(role='partner').count()
    
    total_deliveries = DeliveryRequest.objects.count()
    pending_deliveries = DeliveryRequest.objects.filter(status='pending').count()
    accepted_deliveries = DeliveryRequest.objects.filter(status='accepted').count()
    in_transit_deliveries = DeliveryRequest.objects.filter(status='in_transit').count()
    delivered_deliveries = DeliveryRequest.objects.filter(status='delivered').count()
    
    return json_response({
        'users': {
            'total': total_users,
            'customers': total_customers,
            'partners': total_partners
        },
        'deliveries': {
            'total': total_deliveries,
            'pending': pending_deliveries,
            'accepted': accepted_deliveries,
            'in_transit': in_transit_deliveries,
            'delivered': delivered_deliveries
        }
    })


class PriceEstimateView(APIView):
    """
    POST /api/price/estimate/
    payload: { pickup_address, drop_address, weight }
    response: { distance_km, estimated_price, breakdown, pickup_lat, pickup_lng, drop_lat, drop_lng }
    """
    permission_classes = []  # keep public or add IsAuthenticated if you want auth

    def post(self, request):
        serializer = PriceEstimateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # try to geocode; if it fails, fall back to a conservative distance so UI can continue
        try:
           p_lat, p_lng = geocode_nominatim(data["pickup_address"])
           d_lat, d_lng = geocode_nominatim(data["drop_address"])
           geocoding_used = True
           distance_km = haversine_km(p_lat, p_lng, d_lat, d_lng)
           geocode_note = None
        except Exception as e:
    # Geocoding failed for one or both addresses.
           geocoding_used = False
           geocode_error = str(e)
            # Do NOT call haversine when coords are None
           p_lat = p_lng = d_lat = d_lng = None
            
            # fallback: assume a small city delivery distance. tune this if you want.
           distance_km = getattr(settings, "PARCELBEE_FALLBACK_KM", 5.0)

        # Rates (override in settings if present)
        BASE_FEE = getattr(settings, "PARCELBEE_BASE_FEE", 30.0)
        PER_KM = getattr(settings, "PARCELBEE_PER_KM", 10.0)
        PER_KG = getattr(settings, "PARCELBEE_PER_KG", 5.0)

        weight_fee = data["weight"] * PER_KG
        distance_fee = distance_km * PER_KM
        subtotal = BASE_FEE + distance_fee + weight_fee
        estimated_price = round(subtotal)

        breakdown = {
            "base_fee": BASE_FEE,
            "distance_km": round(distance_km, 3),
            "distance_fee": round(distance_fee, 2),
            "weight_fee": round(weight_fee, 2),
            "subtotal": round(subtotal, 2),
        }

        return Response({
            "distance_km": round(distance_km, 3),
            "estimated_price": estimated_price,
            "breakdown": breakdown,
            "pickup_lat": p_lat,
            "pickup_lng": p_lng,
            "drop_lat": d_lat,
            "drop_lng": d_lng,
            "geocoding_used": geocoding_used,
            "geocode_error": geocode_error if not geocoding_used else None,
            # "note": geocode_note
        })
