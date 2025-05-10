from django.utils import timezone
from rest_framework import serializers

from bookings.models import Booking

from .models import Coupon, CouponApplicability, CouponType, CouponUsage


class CouponSerializer(serializers.ModelSerializer):
    coupon_type_display = serializers.CharField(
        source="get_coupon_type_display", read_only=True
    )
    applicability_display = serializers.CharField(
        source="get_applicability_display", read_only=True
    )
    is_valid = serializers.SerializerMethodField()
    formatted_discount = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = [
            "id",
            "code",
            "description",
            "coupon_type",
            "coupon_type_display",
            "discount_value",
            "max_discount",
            "min_purchase",
            "applicability",
            "applicability_display",
            "valid_from",
            "valid_to",
            "is_active",
            "max_uses",
            "max_uses_per_user",
            "current_uses",
            "is_valid",
            "formatted_discount",
        ]
        read_only_fields = ["current_uses", "is_valid"]

    def get_is_valid(self, obj):
        now = timezone.now()
        return (
            obj.is_active
            and obj.valid_from <= now <= obj.valid_to
            and (obj.max_uses == 0 or obj.current_uses < obj.max_uses)
        )

    def get_formatted_discount(self, obj):
        if obj.coupon_type == CouponType.PERCENTAGE:
            result = f"{obj.discount_value}% off"
            if obj.max_discount:
                result += f" (up to ${obj.max_discount})"
        else:
            result = f"${obj.discount_value} off"

        if obj.min_purchase:
            result += f" on orders over ${obj.min_purchase}"

        return result


class CouponValidationSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=20)
    booking_id = serializers.IntegerField(required=False)
    show_id = serializers.IntegerField(required=False)
    seats = serializers.ListField(child=serializers.IntegerField(), required=False)

    def validate(self, data):
        code = data.get("code")
        booking_id = data.get("booking_id")
        show_id = data.get("show_id")
        seats = data.get("seats", [])

        try:
            coupon = Coupon.objects.get(code=code, is_active=True)
        except Coupon.DoesNotExist:
            raise serializers.ValidationError({"code": "Invalid coupon code"})

        # Validate coupon expiration
        now = timezone.now()
        if now < coupon.valid_from:
            raise serializers.ValidationError({"code": "This coupon is not valid yet"})
        if now > coupon.valid_to:
            raise serializers.ValidationError({"code": "This coupon has expired"})

        # Validate usage limits
        if coupon.max_uses > 0 and coupon.current_uses >= coupon.max_uses:
            raise serializers.ValidationError(
                {"code": "This coupon has reached its usage limit"}
            )

        # Get the booking if provided
        booking = None
        if booking_id:
            try:
                booking = Booking.objects.get(id=booking_id)

                # Check if user has already used this coupon
                user = booking.user
                if coupon.max_uses_per_user > 0:
                    user_usages = CouponUsage.objects.filter(
                        coupon=coupon, user=user
                    ).count()
                    if user_usages >= coupon.max_uses_per_user:
                        raise serializers.ValidationError(
                            {
                                "code": f"You have already used this coupon {user_usages} times (limit: {coupon.max_uses_per_user})"
                            }
                        )

                # Check minimum purchase requirement
                if coupon.min_purchase and booking.total_amount < coupon.min_purchase:
                    raise serializers.ValidationError(
                        {
                            "code": f"This coupon requires a minimum purchase of ${coupon.min_purchase}"
                        }
                    )

                # Validate applicability
                show = booking.show
                if coupon.applicability == CouponApplicability.SPECIFIC_MOVIES:
                    if show.movie not in coupon.applicable_movies.all():
                        raise serializers.ValidationError(
                            {"code": "This coupon is not valid for the selected movie"}
                        )
                elif coupon.applicability == CouponApplicability.SPECIFIC_THEATERS:
                    if show.theater not in coupon.applicable_theaters.all():
                        raise serializers.ValidationError(
                            {
                                "code": "This coupon is not valid for the selected theater"
                            }
                        )
                elif coupon.applicability == CouponApplicability.SPECIFIC_SHOWS:
                    # Only validate if there are applicable shows assigned
                    if (
                        coupon.applicable_shows.exists()
                        and show not in coupon.applicable_shows.all()
                    ):
                        raise serializers.ValidationError(
                            {"code": "This coupon is not valid for the selected show"}
                        )
            except Booking.DoesNotExist:
                raise serializers.ValidationError({"booking_id": "Booking not found"})

        # Store coupon in validated data for later use
        data["coupon"] = coupon
        data["booking"] = booking

        return data


class CouponUsageSerializer(serializers.ModelSerializer):
    coupon_code = serializers.CharField(source="coupon.code", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    booking_number = serializers.CharField(
        source="booking.booking_number", read_only=True
    )

    class Meta:
        model = CouponUsage
        fields = [
            "id",
            "coupon",
            "coupon_code",
            "user",
            "user_email",
            "booking",
            "booking_number",
            "discount_amount",
            "used_at",
        ]
        read_only_fields = ["used_at"]


class ApplyCouponSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=20)

    def validate_code(self, value):
        try:
            coupon = Coupon.objects.get(code=value, is_active=True)

            # Check if coupon is valid
            now = timezone.now()
            if not (coupon.valid_from <= now <= coupon.valid_to):
                raise serializers.ValidationError("Coupon is not valid at this time")

            # Check usage limits
            if coupon.max_uses > 0 and coupon.current_uses >= coupon.max_uses:
                raise serializers.ValidationError("Coupon has reached its usage limit")

            return value
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Invalid coupon code")
