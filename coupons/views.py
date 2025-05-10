from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from bookings.models import Booking
from users.permissions import IsAdminUser, IsStaffUser

from .models import Coupon, CouponType, CouponUsage
from .serializers import (
    ApplyCouponSerializer,
    CouponSerializer,
    CouponUsageSerializer,
    CouponValidationSerializer,
)


class CouponViewSet(viewsets.ModelViewSet):
    """
    API endpoint for coupon management
    """

    queryset = Coupon.objects.all().order_by("-created_at")
    serializer_class = CouponSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ["is_active", "coupon_type", "applicability"]
    search_fields = ["code", "description"]
    ordering_fields = ["created_at", "valid_from", "valid_to", "current_uses"]

    def get_permissions(self):
        if (
            self.action == "validate"
            or self.action == "list"
            or self.action == "retrieve"
            or self.action == "apply"
            or self.action == "apply_to_booking"
        ):
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    @action(detail=False, methods=["post"])
    def validate(self, request):
        """
        Validate a coupon code for a given booking or show
        """
        serializer = CouponValidationSerializer(data=request.data)
        if serializer.is_valid():
            coupon = serializer.validated_data["coupon"]
            return Response(
                {
                    "valid": True,
                    "coupon": CouponSerializer(coupon).data,
                    "discount_info": self._calculate_discount_info(
                        coupon, booking=serializer.validated_data.get("booking")
                    ),
                }
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def apply_to_booking(self, request, pk=None):
        """
        Apply a coupon to a booking
        """
        coupon = self.get_object()

        # Verify booking ID is provided
        booking_id = request.data.get("booking_id")
        if not booking_id:
            return Response(
                {"error": "booking_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if coupon is already applied to this booking
        if CouponUsage.objects.filter(coupon=coupon, booking=booking).exists():
            return Response(
                {"error": "Coupon already applied to this booking"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate coupon for this booking
        validation_data = {"code": coupon.code, "booking_id": booking_id}
        serializer = CouponValidationSerializer(data=validation_data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Calculate discount
        discount_info = self._calculate_discount_info(coupon, booking=booking)
        discount_amount = discount_info["discount_amount"]

        # Create coupon usage record
        usage = CouponUsage.objects.create(
            coupon=coupon,
            user=request.user,
            booking=booking,
            discount_amount=discount_amount,
        )

        # Update coupon usage count
        coupon.current_uses += 1
        coupon.save()

        # Update booking with discount
        booking.discount_amount = discount_amount
        booking.save()

        return Response(
            {
                "success": True,
                "message": f"Coupon applied successfully. Discount: ${discount_amount:.2f}",
                "discount_amount": discount_amount,
                "booking_total": booking.total,
            }
        )

    @action(detail=False, methods=["post"])
    def apply(self, request):
        """
        Apply a coupon to a booking by code
        """
        serializer = ApplyCouponSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data["code"]
        booking_id = request.data.get("booking_id")

        if not booking_id:
            return Response(
                {"error": "booking_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            coupon = Coupon.objects.get(code=code, is_active=True)
        except Coupon.DoesNotExist:
            return Response(
                {"error": "Invalid coupon code"}, status=status.HTTP_404_NOT_FOUND
            )

        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if coupon is already applied to this booking
        if CouponUsage.objects.filter(coupon=coupon, booking=booking).exists():
            return Response(
                {"error": "Coupon already applied to this booking"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate coupon for this booking
        validation_data = {"code": coupon.code, "booking_id": booking_id}
        serializer = CouponValidationSerializer(data=validation_data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Calculate discount
        discount_info = self._calculate_discount_info(coupon, booking=booking)
        discount_amount = discount_info["discount_amount"]

        # Create coupon usage record
        usage = CouponUsage.objects.create(
            coupon=coupon,
            user=request.user,
            booking=booking,
            discount_amount=discount_amount,
        )

        # Update coupon usage count
        coupon.current_uses += 1
        coupon.save()

        # Update booking with discount
        booking.discount_amount = discount_amount
        booking.save()

        return Response(
            {
                "success": True,
                "message": f"Coupon applied successfully. Discount: ${discount_amount:.2f}",
                "discount_amount": discount_amount,
                "booking_total": booking.total,
            }
        )

    def _calculate_discount_info(self, coupon, booking=None):
        """
        Calculate discount information for a coupon
        """
        if not booking:
            return {
                "discount_type": coupon.get_coupon_type_display(),
                "discount_value": coupon.discount_value,
                "max_discount": coupon.max_discount,
                "min_purchase": coupon.min_purchase,
                "discount_amount": None,  # Cannot calculate without booking
            }

        # Calculate discount amount
        total = booking.total_amount
        if coupon.coupon_type == CouponType.PERCENTAGE:
            discount = total * (coupon.discount_value / 100)
            if coupon.max_discount and discount > coupon.max_discount:
                discount = coupon.max_discount
        else:  # Fixed amount
            discount = coupon.discount_value
            if discount > total:
                discount = total

        return {
            "discount_type": coupon.get_coupon_type_display(),
            "discount_value": coupon.discount_value,
            "max_discount": coupon.max_discount,
            "min_purchase": coupon.min_purchase,
            "discount_amount": discount,
        }


class CouponUsageViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """
    API endpoint for viewing coupon usage history
    """

    serializer_class = CouponUsageSerializer
    permission_classes = [IsStaffUser]
    filterset_fields = ["coupon", "user"]
    search_fields = ["coupon__code", "user__email", "booking__booking_number"]
    ordering_fields = ["used_at"]

    def get_queryset(self):
        if self.request.user.is_staff:
            return CouponUsage.objects.all().order_by("-used_at")
        return CouponUsage.objects.filter(user=self.request.user).order_by("-used_at")

    def get_permissions(self):
        if self.action == "list_my_usages":
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    @action(detail=False, methods=["get"])
    def list_my_usages(self, request):
        """
        List all coupon usages for the current user
        """
        queryset = CouponUsage.objects.filter(user=request.user).order_by("-used_at")
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
