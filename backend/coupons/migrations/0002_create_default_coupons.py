from datetime import timedelta

from django.db import migrations
from django.utils import timezone


def create_default_coupons(apps, schema_editor):
    """
    Create default coupon templates for common scenarios
    """
    Coupon = apps.get_model("coupons", "Coupon")

    # Get current date for validity
    now = timezone.now()

    # Create default coupons
    default_coupons = [
        {
            "code": "WELCOME20",
            "description": "Welcome coupon for new users - 20% off your first booking",
            "coupon_type": "PERCENTAGE",
            "discount_value": 20.00,
            "max_discount": 50.00,
            "min_purchase": 0,
            "applicability": "ALL",
            "valid_from": now,
            "valid_to": now + timedelta(days=365),  # Valid for a year
            "is_active": True,
            "max_uses": 1000,
            "max_uses_per_user": 1,
        },
        {
            "code": "FLAT10",
            "description": "Fixed $10 discount on all bookings",
            "coupon_type": "FIXED",
            "discount_value": 10.00,
            "max_discount": None,
            "min_purchase": 20.00,
            "applicability": "ALL",
            "valid_from": now,
            "valid_to": now + timedelta(days=90),  # Valid for 90 days
            "is_active": True,
            "max_uses": 500,
            "max_uses_per_user": 5,
        },
        {
            "code": "SPECIAL25",
            "description": "25% off premium shows",
            "coupon_type": "PERCENTAGE",
            "discount_value": 25.00,
            "max_discount": 100.00,
            "min_purchase": 0,
            "applicability": "SPECIFIC_SHOWS",
            "valid_from": now,
            "valid_to": now + timedelta(days=30),  # Valid for 30 days
            "is_active": True,
            "max_uses": 200,
            "max_uses_per_user": 2,
        },
    ]

    # Create default coupons
    for coupon_data in default_coupons:
        Coupon.objects.get_or_create(code=coupon_data["code"], defaults=coupon_data)


def remove_default_coupons(apps, schema_editor):
    """
    Remove default coupons
    """
    Coupon = apps.get_model("coupons", "Coupon")
    Coupon.objects.filter(code__in=["WELCOME20", "FLAT10", "SPECIAL25"]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("coupons", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_default_coupons, remove_default_coupons),
    ]
