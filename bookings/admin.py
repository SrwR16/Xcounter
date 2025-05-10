from django.contrib import admin

from .models import Booking, Ticket


class TicketInline(admin.TabularInline):
    model = Ticket
    extra = 0
    readonly_fields = ("ticket_number", "created_at")


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        "booking_number",
        "user",
        "show",
        "total_seats",
        "total_amount",
        "payment_status",
        "booking_status",
        "created_at",
    )
    list_filter = ("payment_status", "booking_status", "created_at")
    search_fields = ("booking_number", "user__email", "show__movie__title")
    readonly_fields = ("booking_number", "created_at", "updated_at")
    inlines = [TicketInline]

    fieldsets = (
        (
            "Booking Information",
            {
                "fields": (
                    "booking_number",
                    "user",
                    "show",
                    "total_seats",
                    "total_amount",
                )
            },
        ),
        ("Status Information", {"fields": ("payment_status", "booking_status")}),
        ("Payment Details", {"fields": ("payment_method", "payment_reference")}),
        (
            "Promotion and Discounts",
            {"fields": ("promotion_applied", "discount_amount")},
        ),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = (
        "ticket_number",
        "booking",
        "seat_number",
        "seat_category",
        "price",
        "is_used",
    )
    list_filter = ("seat_category", "is_used", "created_at")
    search_fields = ("ticket_number", "booking__booking_number", "seat_number")
    readonly_fields = ("ticket_number", "created_at")

    fieldsets = (
        (
            "Ticket Information",
            {
                "fields": (
                    "ticket_number",
                    "booking",
                    "seat_number",
                    "seat_category",
                    "price",
                )
            },
        ),
        ("Status", {"fields": ("is_used",)}),
        ("QR Code", {"fields": ("qr_code",)}),
        ("Timestamps", {"fields": ("created_at",)}),
    )
