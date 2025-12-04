from django.contrib import admin

# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from core.models import User, DeliveryRequest


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'role', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('email', 'name', 'phone')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name', 'phone', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'role', 'password1', 'password2'),
        }),
    )


@admin.register(DeliveryRequest)
class DeliveryRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'partner', 'status', 'weight', 'created_at')
    list_filter = ('status', 'created_at', 'updated_at')
    search_fields = ('customer__name', 'partner__name', 'pickup_address', 'drop_address', 'description')
    readonly_fields = ('created_at', 'updated_at', 'accepted_at', 'delivered_at')
    
    fieldsets = (
        ('Customer & Partner', {
            'fields': ('customer', 'partner')
        }),
        ('Addresses', {
            'fields': ('pickup_address', 'pickup_lat', 'pickup_lng', 'drop_address', 'drop_lat', 'drop_lng')
        }),
        ('Delivery Details', {
            'fields': ('description', 'weight', 'estimated_price', 'status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'accepted_at', 'delivered_at')
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing existing object
            return self.readonly_fields + ('customer',)
        return self.readonly_fields