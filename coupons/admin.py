from django import forms
from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html

from .models import Coupon, CouponApplicability, CouponType, CouponUsage


class CouponUsageInline(admin.TabularInline):
    model = CouponUsage
    readonly_fields = ("user", "booking", "used_at", "discount_amount")
    extra = 0
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class CouponAdminForm(forms.ModelForm):
    class Meta:
        model = Coupon
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        coupon_type = cleaned_data.get("coupon_type")
        discount_value = cleaned_data.get("discount_value")
        max_discount = cleaned_data.get("max_discount")

        if coupon_type == CouponType.PERCENTAGE and discount_value > 100:
            self.add_error("discount_value", "Percentage discount cannot exceed 100%")

        if coupon_type == CouponType.FIXED and max_discount:
            self.add_error(
                "max_discount",
                "Maximum discount is not applicable for fixed amount coupons",
            )

        applicability = cleaned_data.get("applicability")
        applicable_movies = cleaned_data.get("applicable_movies", [])
        applicable_theaters = cleaned_data.get("applicable_theaters", [])
        applicable_shows = cleaned_data.get("applicable_shows", [])

        # Check if applicable items are selected based on applicability type
        if (
            applicability == CouponApplicability.SPECIFIC_MOVIES
            and not applicable_movies
        ):
            self.add_error(
                "applicable_movies",
                'You must select at least one movie for "Specific Movies" applicability',
            )

        if (
            applicability == CouponApplicability.SPECIFIC_THEATERS
            and not applicable_theaters
        ):
            self.add_error(
                "applicable_theaters",
                'You must select at least one theater for "Specific Theaters" applicability',
            )

        if applicability == CouponApplicability.SPECIFIC_SHOWS and not applicable_shows:
            self.add_error(
                "applicable_shows",
                'You must select at least one show for "Specific Shows" applicability',
            )

        return cleaned_data


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    form = CouponAdminForm
    list_display = (
        "code",
        "description_short",
        "discount_display",
        "valid_period",
        "applicability",
        "usage_count",
        "status_badge",
    )
    list_filter = ("is_active", "coupon_type", "applicability", "created_at")
    search_fields = ("code", "description")
    readonly_fields = ("created_at", "updated_at", "current_uses")
    inlines = [CouponUsageInline]

    fieldsets = (
        ("Basic Information", {"fields": ("code", "description", "is_active")}),
        (
            "Discount Details",
            {
                "fields": (
                    "coupon_type",
                    "discount_value",
                    "max_discount",
                    "min_purchase",
                )
            },
        ),
        (
            "Applicability",
            {
                "fields": (
                    "applicability",
                    "applicable_movies",
                    "applicable_theaters",
                    "applicable_shows",
                )
            },
        ),
        ("Validity", {"fields": ("valid_from", "valid_to")}),
        ("Usage Limits", {"fields": ("max_uses", "max_uses_per_user", "current_uses")}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def description_short(self, obj):
        return (
            obj.description[:50] + "..."
            if len(obj.description) > 50
            else obj.description
        )

    description_short.short_description = "Description"

    def discount_display(self, obj):
        if obj.coupon_type == CouponType.PERCENTAGE:
            display = f"{obj.discount_value}%"
            if obj.max_discount:
                display += f" (max ${obj.max_discount})"
        else:
            display = f"${obj.discount_value}"
        return display

    discount_display.short_description = "Discount"

    def valid_period(self, obj):
        now = timezone.now()
        if now < obj.valid_from:
            status = "Not yet active"
        elif now > obj.valid_to:
            status = "Expired"
        else:
            status = "Active"

        return f"{obj.valid_from.date()} to {obj.valid_to.date()} ({status})"

    valid_period.short_description = "Validity Period"

    def usage_count(self, obj):
        if obj.max_uses > 0:
            return f"{obj.current_uses} / {obj.max_uses}"
        return f"{obj.current_uses} (unlimited)"

    usage_count.short_description = "Usage"

    def status_badge(self, obj):
        now = timezone.now()
        if not obj.is_active:
            return format_html(
                '<span style="background-color: #ff9800; padding: 3px 8px; border-radius: 10px; color: white;">Disabled</span>'
            )
        elif now < obj.valid_from:
            return format_html(
                '<span style="background-color: #2196f3; padding: 3px 8px; border-radius: 10px; color: white;">Upcoming</span>'
            )
        elif now > obj.valid_to:
            return format_html(
                '<span style="background-color: #f44336; padding: 3px 8px; border-radius: 10px; color: white;">Expired</span>'
            )
        elif obj.max_uses > 0 and obj.current_uses >= obj.max_uses:
            return format_html(
                '<span style="background-color: #795548; padding: 3px 8px; border-radius: 10px; color: white;">Fully Used</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #4caf50; padding: 3px 8px; border-radius: 10px; color: white;">Active</span>'
            )

    status_badge.short_description = "Status"

    def get_readonly_fields(self, request, obj=None):
        if obj:  # editing an existing object
            return self.readonly_fields + ("code",)
        return self.readonly_fields

    def save_model(self, request, obj, form, change):
        if not obj.code:
            obj.code = Coupon.generate_code(prefix="XC")
        super().save_model(request, obj, form, change)


@admin.register(CouponUsage)
class CouponUsageAdmin(admin.ModelAdmin):
    list_display = (
        "coupon_code",
        "user_email",
        "booking_number",
        "discount_amount",
        "used_at",
    )
    list_filter = ("used_at", "coupon__code")
    search_fields = ("coupon__code", "user__email", "booking__booking_number")
    readonly_fields = ("coupon", "user", "booking", "discount_amount", "used_at")

    def coupon_code(self, obj):
        return obj.coupon.code

    coupon_code.short_description = "Coupon Code"

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = "User"

    def booking_number(self, obj):
        return obj.booking.booking_number if obj.booking else "N/A"

    booking_number.short_description = "Booking"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
