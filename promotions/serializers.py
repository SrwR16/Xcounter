from rest_framework import serializers

from .models import CustomerProfile, CustomerTier, PointsTransaction, TierBenefit


class TierBenefitSerializer(serializers.ModelSerializer):
    tier_display = serializers.CharField(source="get_tier_display", read_only=True)

    class Meta:
        model = TierBenefit
        fields = [
            "id",
            "tier",
            "tier_display",
            "description",
            "booking_discount",
            "monthly_free_tickets",
            "early_booking_days",
            "points_multiplier",
        ]
        read_only_fields = ["tier", "tier_display"]


class PointsTransactionSerializer(serializers.ModelSerializer):
    transaction_type_display = serializers.CharField(
        source="get_transaction_type_display", read_only=True
    )
    booking_number = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PointsTransaction
        fields = [
            "id",
            "customer",
            "transaction_type",
            "transaction_type_display",
            "points",
            "transaction_date",
            "reference",
            "booking",
            "booking_number",
        ]
        read_only_fields = ["transaction_date", "booking_number"]

    def get_booking_number(self, obj):
        return obj.booking.booking_number if obj.booking else None


class CustomerProfileSerializer(serializers.ModelSerializer):
    tier_display = serializers.CharField(source="get_tier_display", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.SerializerMethodField(read_only=True)
    tier_benefits = serializers.SerializerMethodField(read_only=True)
    points_history = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CustomerProfile
        fields = [
            "id",
            "user",
            "user_email",
            "user_name",
            "tier",
            "tier_display",
            "points",
            "lifetime_spending",
            "free_tickets_remaining",
            "free_tickets_reset_date",
            "tier_benefits",
            "points_history",
        ]
        read_only_fields = [
            "tier",
            "tier_display",
            "points",
            "lifetime_spending",
            "free_tickets_remaining",
            "free_tickets_reset_date",
        ]

    def get_user_name(self, obj):
        user = obj.user
        if user.first_name or user.last_name:
            return f"{user.first_name} {user.last_name}".strip()
        return user.email

    def get_tier_benefits(self, obj):
        try:
            benefits = TierBenefit.objects.get(tier=obj.tier)
            return TierBenefitSerializer(benefits).data
        except TierBenefit.DoesNotExist:
            return None

    def get_points_history(self, obj):
        # Get the last 5 transactions by default
        limit = self.context.get("points_history_limit", 5)
        transactions = PointsTransaction.objects.filter(customer=obj).order_by(
            "-transaction_date"
        )[:limit]

        return PointsTransactionSerializer(transactions, many=True).data


class CustomerTierInfoSerializer(serializers.Serializer):
    current_tier = serializers.CharField(read_only=True)
    current_tier_display = serializers.CharField(read_only=True)
    points = serializers.IntegerField(read_only=True)
    lifetime_spending = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    next_tier = serializers.CharField(read_only=True, allow_null=True)
    next_tier_display = serializers.CharField(read_only=True, allow_null=True)
    spending_needed = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True, allow_null=True
    )

    benefits = serializers.DictField(read_only=True)
    next_tier_benefits = serializers.DictField(read_only=True, allow_null=True)

    def to_representation(self, instance):
        # Get current tier benefits
        try:
            current_benefits = TierBenefit.objects.get(tier=instance.tier)
        except TierBenefit.DoesNotExist:
            current_benefits = None

        # Determine next tier and spending needed
        next_tier = None
        next_tier_display = None
        spending_needed = None
        next_tier_benefits = None

        # Define tier progression and spending thresholds
        tiers = [
            (CustomerTier.STANDARD, 0),
            (CustomerTier.SILVER, 100),
            (CustomerTier.GOLD, 500),
            (CustomerTier.PLATINUM, 1000),
            (CustomerTier.VIP, 2500),
        ]

        # Find the next tier
        for i, (tier, threshold) in enumerate(tiers):
            if instance.tier == tier and i < len(tiers) - 1:
                next_tier = tiers[i + 1][0]
                next_tier_threshold = tiers[i + 1][1]
                spending_needed = max(
                    next_tier_threshold - float(instance.lifetime_spending), 0
                )

                try:
                    next_tier_benefits = TierBenefit.objects.get(tier=next_tier)
                except TierBenefit.DoesNotExist:
                    next_tier_benefits = None

                next_tier_display = dict(CustomerTier.choices)[next_tier]
                break

        # Format benefits for current tier
        benefits_data = {}
        if current_benefits:
            benefits_data = {
                "booking_discount": f"{current_benefits.booking_discount}%",
                "monthly_free_tickets": current_benefits.monthly_free_tickets,
                "early_booking_days": current_benefits.early_booking_days,
                "points_multiplier": f"{current_benefits.points_multiplier}x",
            }

        # Format benefits for next tier if applicable
        next_benefits_data = None
        if next_tier_benefits:
            next_benefits_data = {
                "booking_discount": f"{next_tier_benefits.booking_discount}%",
                "monthly_free_tickets": next_tier_benefits.monthly_free_tickets,
                "early_booking_days": next_tier_benefits.early_booking_days,
                "points_multiplier": f"{next_tier_benefits.points_multiplier}x",
            }

        return {
            "current_tier": instance.tier,
            "current_tier_display": instance.get_tier_display(),
            "points": instance.points,
            "lifetime_spending": instance.lifetime_spending,
            "next_tier": next_tier,
            "next_tier_display": next_tier_display,
            "spending_needed": spending_needed,
            "benefits": benefits_data,
            "next_tier_benefits": next_benefits_data,
        }


class AdjustPointsSerializer(serializers.Serializer):
    points = serializers.IntegerField(required=True)
    reason = serializers.CharField(required=True, max_length=255)

    def validate_points(self, value):
        if value == 0:
            raise serializers.ValidationError("Points adjustment cannot be zero")
        return value
