from django.db import transaction
from rest_framework import serializers

from movies.serializers import ShowDetailSerializer
from users.serializers import UserSerializer

from .models import Booking, SeatCategory, Ticket


class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = [
            "id",
            "ticket_number",
            "seat_number",
            "seat_category",
            "price",
            "is_used",
            "created_at",
        ]
        read_only_fields = ["id", "ticket_number", "created_at"]


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
