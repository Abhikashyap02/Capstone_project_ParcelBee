from rest_framework import serializers

class PriceEstimateSerializer(serializers.Serializer):
    pickup_address = serializers.CharField(required=True)
    drop_address = serializers.CharField(required=True)
    weight = serializers.FloatField(required=True, min_value=0.1)