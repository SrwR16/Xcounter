from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from movies.serializers import ShowDetailSerializer
from users.serializers import UserSerializer

from .models import Booking, BookingStatus, PaymentStatus, SeatCategory, Ticket


class TicketSerializer(serializers.ModelSerializer):
    show_title = serializers.ReadOnlyField(source="booking.show.movie.title")
    show_date = serializers.ReadOnlyField(source="booking.show.start_time")
    booking_number = serializers.ReadOnlyField(source="booking.booking_number")

    class Meta:
        model = Ticket
        fields = [
            "id",
            "ticket_number",
            "booking",
            "booking_number",
            "show_title",
            "show_date",
            "seat_number",
            "seat_category",
            "price",
            "is_used",
            "qr_code",
        ]
        read_only_fields = ["id", "ticket_number", "created_at"]


class VIPTicketSerializer(TicketSerializer):
    """Specialized serializer for VIP tickets with additional fields"""

    is_vip = serializers.SerializerMethodField()
    reserved_by = serializers.SerializerMethodField()

    class Meta(TicketSerializer.Meta):
        fields = TicketSerializer.Meta.fields + ["is_vip", "reserved_by"]

    def get_is_vip(self, obj):
        return obj.seat_category == SeatCategory.VIP

    def get_reserved_by(self, obj):
        if obj.booking.payment_method == "Admin VIP Reservation":
            return "Reserved by Admin"
        return None


class BookingListSerializer(serializers.ModelSerializer):
    show_details = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id",
            "booking_number",
            "show_details",
            "total_seats",
            "total_amount",
            "booking_status",
            "payment_status",
            "created_at",
        ]
        read_only_fields = ["id", "booking_number", "created_at"]

    def get_show_details(self, obj):
        return {
            "movie_title": obj.show.movie.title,
            "theater_name": obj.show.theater.name,
            "start_time": obj.show.start_time,
            "show_type": obj.show.show_type,
        }


class BookingDetailSerializer(serializers.ModelSerializer):
    tickets = TicketSerializer(many=True, read_only=True)
    show = ShowDetailSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "booking_number",
            "user",
            "show",
            "total_seats",
            "total_amount",
            "booking_status",
            "payment_status",
            "promotion_applied",
            "discount_amount",
            "payment_method",
            "created_at",
            "updated_at",
            "tickets",
        ]
        read_only_fields = ["id", "booking_number", "created_at", "updated_at"]


class BookingCreateSerializer(serializers.ModelSerializer):
    show_id = serializers.IntegerField(write_only=True)
    seat_numbers = serializers.ListField(
        child=serializers.CharField(max_length=10), write_only=True
    )

    class Meta:
        model = Booking
        fields = ["show_id", "seat_numbers", "total_amount", "payment_method"]

    def validate(self, data):
        from movies.models import Show

        # Validate show exists
        show_id = data.get("show_id")
        try:
            show = Show.objects.get(pk=show_id, is_active=True)
        except Show.DoesNotExist:
            raise serializers.ValidationError(
                {"show_id": "Show does not exist or is not active"}
            )

        # Check if show has enough available seats
        seat_numbers = data.get("seat_numbers", [])
        if len(seat_numbers) > show.available_seats:
            raise serializers.ValidationError(
                {"seat_numbers": "Not enough available seats"}
            )

        # Validate all seat numbers are unique
        if len(seat_numbers) != len(set(seat_numbers)):
            raise serializers.ValidationError(
                {"seat_numbers": "Duplicate seat numbers are not allowed"}
            )

        # Check if any of the selected seats are already booked
        existing_tickets = Ticket.objects.filter(
            booking__show=show,
            booking__booking_status__in=["RESERVED", "CONFIRMED"],
            seat_number__in=seat_numbers,
        )
        if existing_tickets.exists():
            booked_seats = list(existing_tickets.values_list("seat_number", flat=True))
            raise serializers.ValidationError(
                {"seat_numbers": f"Seats {', '.join(booked_seats)} are already booked"}
            )

        # Store the show for later use in create method
        self.show = show
        return data

    @transaction.atomic
    def create(self, validated_data):
        user = self.context["request"].user
        show = self.show
        seat_numbers = validated_data.pop("seat_numbers")
        show_id = validated_data.pop("show_id")

        # Create the booking
        booking = Booking.objects.create(
            user=user, show=show, total_seats=len(seat_numbers), **validated_data
        )

        # Create tickets for each seat
        for seat_number in seat_numbers:
            Ticket.objects.create(
                booking=booking,
                seat_number=seat_number,
                price=show.price,  # Use the show price as default
                seat_category=SeatCategory.STANDARD,  # Default to standard seats
            )

        # Update show's available seats
        show.available_seats = show.available_seats - len(seat_numbers)
        show.save(update_fields=["available_seats"])

        return booking


class BookingUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            "payment_status",
            "booking_status",
            "payment_method",
            "payment_reference",
        ]


class VIPReservationSerializer(serializers.ModelSerializer):
    """
    Serializer for admin-only VIP ticket reservations.
    This allows admins to create special VIP reservations for important guests.
    """

    show_id = serializers.IntegerField(write_only=True)
    user_email = serializers.EmailField(write_only=True)
    seat_numbers = serializers.ListField(child=serializers.CharField(), write_only=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "show_id",
            "user_email",
            "seat_numbers",
            "total_amount",
            "booking_status",
            "payment_status",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "booking_status", "payment_status", "created_at"]

    def validate_user_email(self, value):
        """Validate that the user exists."""
        try:
            from users.models import CustomUser

            CustomUser.objects.get(email=value)
            return value
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")

    def validate_show_id(self, value):
        """Validate that the show exists and is active."""
        try:
            from movies.models import Show

            show = Show.objects.get(pk=value, is_active=True)
            self.show = show
            return value
        except Show.DoesNotExist:
            raise serializers.ValidationError("Show does not exist or is not active.")

    def validate_seat_numbers(self, value):
        """Validate that the seats are available."""
        if not hasattr(self, "show"):
            return value

        # Get booked seats
        booked_seats = Ticket.objects.filter(
            booking__show=self.show,
            booking__booking_status__in=[
                BookingStatus.RESERVED,
                BookingStatus.CONFIRMED,
            ],
        ).values_list("seat_number", flat=True)

        # Check if any requested seats are already booked
        unavailable_seats = [seat for seat in value if seat in booked_seats]
        if unavailable_seats:
            raise serializers.ValidationError(
                f"The following seats are already booked: {', '.join(unavailable_seats)}"
            )

        return value

    @transaction.atomic
    def create(self, validated_data):
        """Create a VIP booking with special handling."""
        from users.models import CustomUser

        user_email = validated_data.pop("user_email")
        show = self.show
        seat_numbers = validated_data.pop("seat_numbers")
        validated_data.pop("show_id")
        notes = validated_data.pop("notes", "")

        # Get the user
        user = CustomUser.objects.get(email=user_email)

        # Create the booking with VIP status
        booking = Booking.objects.create(
            user=user,
            show=show,
            total_seats=len(seat_numbers),
            booking_status=BookingStatus.CONFIRMED,  # Auto-confirm VIP reservations
            payment_status=PaymentStatus.COMPLETED,  # Auto-complete payment
            promotion_applied=True,
            payment_method="Admin VIP Reservation",
            payment_reference=f"VIP-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            **validated_data,
        )

        # Create tickets for each seat as VIP category
        for seat_number in seat_numbers:
            Ticket.objects.create(
                booking=booking,
                seat_number=seat_number,
                price=show.price,
                seat_category=SeatCategory.VIP,  # Mark as VIP seats
            )

        # Update show's available seats
        show.available_seats = show.available_seats - len(seat_numbers)
        show.save(update_fields=["available_seats"])

        return booking
