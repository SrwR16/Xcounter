from django.contrib import admin, messages
from django.utils.html import format_html

from .models import CustomerProfile, PointsTransaction, TierBenefit


@admin.register(TierBenefit)
class TierBenefitAdmin(admin.ModelAdmin):
    list_display = (
        "tier",
        "booking_discount",
        "monthly_free_tickets",
        "early_booking_days",
        "points_multiplier",
    )
    list_filter = ("tier",)
    search_fields = ("tier",)

    fieldsets = (
        ("Tier Information", {"fields": ("tier", "description")}),
        ("Discount Benefits", {"fields": ("booking_discount", "points_multiplier")}),
        ("Free Tickets", {"fields": ("monthly_free_tickets",)}),
        ("Early Access", {"fields": ("early_booking_days",)}),
    )

    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of standard tier benefits
        if obj and obj.tier == "STANDARD":
            return False
        return super().has_delete_permission(request, obj)


class PointsTransactionInline(admin.TabularInline):
    model = PointsTransaction
    extra = 0
    readonly_fields = (
        "transaction_type",
        "points",
        "transaction_date",
        "reference",
        "booking",
    )

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user_email",
        "tier_badge",
        "points_display",
        "lifetime_spending",
        "joined_date",
    )
    list_filter = ("tier",)
    search_fields = ("user__email", "user__first_name", "user__last_name")
    readonly_fields = ("lifetime_spending", "tier", "last_tier_check")
    inlines = [PointsTransactionInline]

    fieldsets = (
        ("User Information", {"fields": ("user", "tier", "tier_override")}),
        ("Points & Spending", {"fields": ("points", "lifetime_spending")}),
        (
            "Free Tickets",
            {"fields": ("free_tickets_remaining", "free_tickets_reset_date")},
        ),
        ("Timestamps", {"fields": ("last_tier_check",), "classes": ("collapse",)}),
    )

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = "User"

    def points_display(self, obj):
        return f"{obj.points:,} points"

    points_display.short_description = "Points"

    def joined_date(self, obj):
        return obj.user.date_joined.date()

    joined_date.short_description = "Member Since"

    def tier_badge(self, obj):
        tier_colors = {
            "STANDARD": "#9e9e9e",  # Gray
            "SILVER": "#b4b4b4",  # Silver
            "GOLD": "#ffc107",  # Gold
            "PLATINUM": "#7986cb",  # Platinum (blue-ish)
            "VIP": "#ff5722",  # VIP (orange-red)
        }
        color = tier_colors.get(obj.tier, "#9e9e9e")
        return format_html(
            '<span style="background-color: {}; padding: 3px 8px; border-radius: 10px; color: {}; font-weight: bold;">{}</span>',
            color,
            "#ffffff" if obj.tier in ["VIP", "PLATINUM", "GOLD"] else "#000000",
            obj.tier,
        )

    tier_badge.short_description = "Tier"

    def save_model(self, request, obj, form, change):
        is_new = not obj.pk
        old_tier = None if is_new else CustomerProfile.objects.get(pk=obj.pk).tier

        # Check if tier_override was updated
        tier_override_updated = "tier_override" in form.changed_data

        super().save_model(request, obj, form, change)

        # If tier_override was updated, update tier
        if tier_override_updated:
            if obj.tier_override:
                obj.tier = obj.tier_override
                obj.save(update_fields=["tier"])
                messages.success(request, f"Customer tier manually set to {obj.tier}.")
            else:
                # Recalculate tier based on spending
                old_tier = obj.tier
                obj.update_tier()
                if old_tier != obj.tier:
                    messages.success(
                        request, f"Customer tier recalculated: {old_tier} → {obj.tier}"
                    )
                else:
                    messages.info(request, f"Customer tier remains at {obj.tier}")

    def get_readonly_fields(self, request, obj=None):
        if obj:  # editing existing object
            return self.readonly_fields + ("user",)
        return self.readonly_fields

    def has_delete_permission(self, request, obj=None):
        return False  # Don't allow deletion of customer profiles


@admin.register(PointsTransaction)
class PointsTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "customer_email",
        "transaction_type",
        "points",
        "transaction_date",
        "reference_display",
    )
    list_filter = ("transaction_type", "transaction_date")
    search_fields = ("customer__user__email", "reference", "booking__booking_number")
    readonly_fields = (
        "customer",
        "transaction_type",
        "points",
        "transaction_date",
        "reference",
        "booking",
    )

    def reference_display(self, obj):
        if obj.booking:
            return f"Booking: {obj.booking.booking_number}"
        return obj.reference or "N/A"

    reference_display.short_description = "Reference"

    def customer_email(self, obj):
        return obj.customer.user.email

    customer_email.short_description = "Customer"

    def has_add_permission(self, request):
        return True  # Allow manual points adjustment

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
