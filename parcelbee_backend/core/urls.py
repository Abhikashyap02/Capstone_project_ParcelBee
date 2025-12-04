from django.urls import path
from core import views
from .views import PriceEstimateView



urlpatterns = [
    # Authentication
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    
    # Delivery Management
    path('delivery/create/', views.create_delivery, name='create_delivery'),
    path('delivery/list/', views.list_deliveries, name='list_deliveries'),
    path('delivery/<int:delivery_id>/', views.get_delivery_detail, name='delivery_detail'),
    path('delivery/<int:delivery_id>/accept/', views.accept_delivery, name='accept_delivery'),
    path('delivery/<int:delivery_id>/update-status/', views.update_delivery_status, name='update_delivery_status'),
    
    # Admin
    path('admin/overview/', views.admin_overview, name='admin_overview'),

    #priceEstimationApi
    path("price/estimate/", PriceEstimateView.as_view(), name="price-estimate"),

]   