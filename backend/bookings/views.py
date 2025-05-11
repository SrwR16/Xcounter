from django.db.models import Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from movies.models import Show
from users.permissions import IsAdmin

from .models import Booking, BookingStatus, PaymentStatus, SeatCategory, Ticket
from .serializers import (
    BookingCreateSerializer,
    BookingDetailSerializer,
    BookingListSerializer,
    BookingUpdateSerializer,
    TicketSerializer,
    VIPReservationSerializer,
    VIPTicketSerializer,
)


class BookingViewSet(viewsets.ModelViewSet):
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["booking_status", "payment_status", "created_at"]
    search_fields = ["booking_number", "user__email", "show__movie__title"]
    ordering_fields = ["created_at", "total_amount", "total_seats"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user

        # Admin can see all bookings
        if user.is_staff:
            return Booking.objects.select_related(
                "user", "show", "show__movie", "show__theater"
            ).all()

        # Regular users can only see their own bookings
        return Booking.objects.select_related(
            "user", "show", "show__movie", "show__theater"
        ).filter(user=user)

    def get_serializer_class(self):
        if self.action == "create":
            return BookingCreateSerializer
        elif self.action == "update" or self.action == "partial_update":
            return BookingUpdateSerializer
        elif self.action == "list":
            return BookingListSerializer
        return BookingDetailSerializer

    def get_permissions(self):
        if self.action in ["create", "seats"]:
            return [permissions.IsAuthenticated()]
        elif self.action in ["update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated(), IsAdmin()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=["get"])
    def seats(self, request):
        """Get available seats for a show"""
        show_id = request.query_params.get("show_id")
        if not show_id:
            return Response(
                {"detail": "show_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            show = Show.objects.get(pk=show_id, is_active=True)
        except Show.DoesNotExist:
            return Response(
                {"detail": "Show not found or is not active"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get booked seats
        booked_seats = Ticket.objects.filter(
            booking__show=show,
            booking__booking_status__in=[
                BookingStatus.RESERVED,
                BookingStatus.CONFIRMED,
            ],
        ).values_list("seat_number", flat=True)

        # Generate all possible seats (example: A1-A10, B1-B10, etc.)
        rows = "ABCDEFGHIJ"
        cols = range(1, 11)  # 1-10
        all_seats = [f"{row}{col}" for row in rows for col in cols]

        # Filter out booked seats
        available_seats = [seat for seat in all_seats if seat not in booked_seats]

        return Response(
            {
                "show_id": show_id,
                "total_seats": show.total_seats,
                "available_seats_count": show.available_seats,
                "available_seats": available_seats,
                "booked_seats": list(booked_seats),
            }
        )

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        booking = self.get_object()

        # Check if the booking can be cancelled
        if booking.booking_status in [BookingStatus.CONFIRMED, BookingStatus.RESERVED]:
            # If the show is less than 3 hours away, don't allow cancellation
            time_until_show = booking.show.start_time - timezone.now()
            if time_until_show.total_seconds() < 10800:  # 3 hours in seconds
                return Response(
                    {
                        "detail": "Cannot cancel booking less than 3 hours before the show."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Update booking status
            booking.booking_status = BookingStatus.CANCELLED

            # If payment was completed, set to refunded
            if booking.payment_status == PaymentStatus.COMPLETED:
                booking.payment_status = PaymentStatus.REFUNDED

            booking.save(update_fields=["booking_status", "payment_status"])

            # Return available seats to the show
            booking.show.available_seats += booking.total_seats
            booking.show.save(update_fields=["available_seats"])

            return Response(
                {"detail": "Booking cancelled successfully."}, status=status.HTTP_200_OK
            )
        else:
            return Response(
                {
                    "detail": f"Cannot cancel booking with status {booking.booking_status}."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["post"])
    def confirm_payment(self, request, pk=None):
        booking = self.get_object()

        # Only admin or the booking owner can confirm payment
        if not request.user.is_staff and booking.user != request.user:
            return Response(
                {"detail": "You do not have permission to confirm this payment."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if the booking can be confirmed
        if booking.booking_status == BookingStatus.RESERVED:
            # Update booking status
            booking.booking_status = BookingStatus.CONFIRMED
            booking.payment_status = PaymentStatus.COMPLETED

            # Capture payment reference if provided
            if request.data.get("payment_reference"):
                booking.payment_reference = request.data.get("payment_reference")

            booking.save()

            return Response(
                {"detail": "Payment confirmed successfully."}, status=status.HTTP_200_OK
            )
        else:
            return Response(
                {
                    "detail": f"Cannot confirm payment for booking with status {booking.booking_status}."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["get"])
    def active(self, request):
        """Get user's active bookings (confirmed and not expired)"""
        queryset = self.get_queryset().filter(
            Q(booking_status=BookingStatus.CONFIRMED)
            | Q(booking_status=BookingStatus.RESERVED),
            show__start_time__gt=timezone.now(),
        )
        serializer = BookingListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def history(self, request):
        """Get user's booking history (past shows)"""
        queryset = self.get_queryset().filter(show__start_time__lt=timezone.now())
        serializer = BookingListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], permission_classes=[IsAdmin])
    def vip_reservation(self, request):
        """
        Create a VIP reservation (admin only).
        This allows admins to reserve special VIP tickets for important guests.
        """
        serializer = VIPReservationSerializer(data=request.data)
        if serializer.is_valid():
            booking = serializer.save()
            return Response(
                BookingDetailSerializer(booking).data, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TicketViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["seat_category", "is_used", "booking__show"]
    search_fields = ["ticket_number", "seat_number", "booking__booking_number"]
    ordering_fields = ["created_at", "seat_number"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user

        # Admin can see all tickets
        if user.is_staff:
            return Ticket.objects.select_related(
                "booking", "booking__show", "booking__show__movie"
            ).all()

        # Regular users can only see their own tickets
        return Ticket.objects.select_related(
            "booking", "booking__show", "booking__show__movie"
        ).filter(booking__user=user)

    def get_serializer_class(self):
        """Use different serializer for VIP tickets"""
        if self.action == "vip_tickets" or (
            hasattr(self, "get_object")
            and self.get_object().seat_category == SeatCategory.VIP
        ):
            return VIPTicketSerializer
        return TicketSerializer

    @action(detail=True, methods=["post"])
    def mark_as_used(self, request, pk=None):
        """Mark a ticket as used (staff only)"""
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to mark tickets as used."},
                status=status.HTTP_403_FORBIDDEN,
            )

        ticket = self.get_object()
        ticket.is_used = True
        ticket.save(update_fields=["is_used"])

        return Response(
            {"detail": f"Ticket {ticket.ticket_number} marked as used."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], permission_classes=[IsAdmin])
    def vip_tickets(self, request):
        """Get all VIP tickets (admin only)"""
        queryset = Ticket.objects.select_related(
            "booking", "booking__show", "booking__show__movie", "booking__user"
        ).filter(seat_category=SeatCategory.VIP)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
