from django.db import migrations


def create_default_tier_benefits(apps, schema_editor):
    """
    Create default tier benefits for each customer tier
    """
    TierBenefit = apps.get_model("promotions", "TierBenefit")

    # Define tier benefits with their values
    default_benefits = [
        {
            "tier": "STANDARD",
            "description": "Standard membership with basic features.",
            "booking_discount": 0,
            "monthly_free_tickets": 0,
            "early_booking_days": 0,
            "points_multiplier": 1.0,
        },
        {
            "tier": "SILVER",
            "description": "Silver membership with 5% discount and 1 free ticket per month.",
            "booking_discount": 5,
            "monthly_free_tickets": 1,
            "early_booking_days": 1,
            "points_multiplier": 1.2,
        },
        {
            "tier": "GOLD",
            "description": "Gold membership with 10% discount and 2 free tickets per month.",
            "booking_discount": 10,
            "monthly_free_tickets": 2,
            "early_booking_days": 2,
            "points_multiplier": 1.5,
        },
        {
            "tier": "PLATINUM",
            "description": "Platinum membership with 15% discount and 4 free tickets per month.",
            "booking_discount": 15,
            "monthly_free_tickets": 4,
            "early_booking_days": 3,
            "points_multiplier": 2.0,
        },
        {
            "tier": "VIP",
            "description": "VIP membership with 20% discount, 6 free tickets per month, and priority service.",
            "booking_discount": 20,
            "monthly_free_tickets": 6,
            "early_booking_days": 5,
            "points_multiplier": 3.0,
        },
    ]

    # Create tier benefits if they don't exist
    for benefit in default_benefits:
        TierBenefit.objects.get_or_create(tier=benefit["tier"], defaults=benefit)


def remove_default_tier_benefits(apps, schema_editor):
    """
    Remove default tier benefits
    """
    TierBenefit = apps.get_model("promotions", "TierBenefit")
    TierBenefit.objects.filter(
        tier__in=["STANDARD", "SILVER", "GOLD", "PLATINUM", "VIP"]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("promotions", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(
            create_default_tier_benefits, remove_default_tier_benefits
        ),
    ]
