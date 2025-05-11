from django.shortcuts import get_object_or_404
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from users.models import UserProfile
from users.permissions import IsAdminUser, IsStaffUser

from .models import CustomerProfile, PointsTransaction, TierBenefit, TransactionType
from .serializers import (
    AdjustPointsSerializer,
    CustomerProfileSerializer,
    CustomerTierInfoSerializer,
    PointsTransactionSerializer,
    TierBenefitSerializer,
)


class TierBenefitViewSet(viewsets.ModelViewSet):
    """
    API endpoint for tier benefits management
    """

    queryset = TierBenefit.objects.all().order_by("tier")
    serializer_class = TierBenefitSerializer
    permission_classes = [IsAdminUser]

    def get_permissions(self):
        if self.action == "list" or self.action == "retrieve":
            return [permissions.IsAuthenticated()]
        return super().get_permissions()


class CustomerProfileViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    API endpoint for customer profiles and loyalty management
    """

    serializer_class = CustomerProfileSerializer
    permission_classes = [IsStaffUser]
    filterset_fields = ["tier"]
    search_fields = ["user__email", "user__first_name", "user__last_name"]
    ordering_fields = ["lifetime_spending", "points", "tier"]

    def get_queryset(self):
        if self.request.user.is_staff:
            return (
                CustomerProfile.objects.select_related("user")
                .all()
                .order_by("-lifetime_spending")
            )
        return CustomerProfile.objects.filter(user=self.request.user).select_related(
            "user"
        )

    def get_permissions(self):
        if self.action in [
            "me",
            "my_tier_info",
            "adjust_my_points",
            "my_points_history",
        ]:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    @action(detail=False, methods=["get"])
    def me(self, request):
        """
        Get the customer profile for the current user
        """
        try:
            customer_profile = CustomerProfile.objects.get(user=request.user)
        except CustomerProfile.DoesNotExist:
            # Create customer profile if it doesn't exist
            user_profile = get_object_or_404(UserProfile, user=request.user)
            customer_profile = CustomerProfile.objects.create(user=request.user)

        serializer = self.get_serializer(customer_profile)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def my_tier_info(self, request):
        """
        Get the tier information for the current user
        """
        try:
            customer_profile = CustomerProfile.objects.get(user=request.user)
        except CustomerProfile.DoesNotExist:
            customer_profile = CustomerProfile.objects.create(user=request.user)

        # Check if tier update is needed
        if customer_profile.needs_tier_check():
            customer_profile.update_tier()

        serializer = CustomerTierInfoSerializer(customer_profile)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsStaffUser])
    def adjust_points(self, request, pk=None):
        """
        Adjust points for a customer (admin only)
        """
        customer_profile = self.get_object()
        serializer = AdjustPointsSerializer(data=request.data)

        if serializer.is_valid():
            points = serializer.validated_data["points"]
            reason = serializer.validated_data["reason"]

            transaction_type = TransactionType.ADJUSTMENT
            if points > 0:
                customer_profile.add_points(points, reason, transaction_type)
                message = f"Added {points} points to customer account."
            else:
                customer_profile.reduce_points(abs(points), reason, transaction_type)
                message = f"Deducted {abs(points)} points from customer account."

            return Response(
                {
                    "success": True,
                    "message": message,
                    "current_points": customer_profile.points,
                }
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["post"])
    def adjust_my_points(self, request):
        """
        Redeem points for a reward (customer can only spend points)
        """
        try:
            customer_profile = CustomerProfile.objects.get(user=request.user)
        except CustomerProfile.DoesNotExist:
            return Response(
                {"error": "Customer profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdjustPointsSerializer(data=request.data)

        if serializer.is_valid():
            points = serializer.validated_data["points"]
            reason = serializer.validated_data["reason"]

            if points > 0:
                return Response(
                    {"error": "You can only spend points"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            points_to_spend = abs(points)

            # Check if customer has enough points
            if customer_profile.points < points_to_spend:
                return Response(
                    {
                        "error": f"Insufficient points. You have {customer_profile.points} points."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Spend points
            customer_profile.reduce_points(
                points_to_spend, reason, TransactionType.SPENDING
            )

            return Response(
                {
                    "success": True,
                    "message": f"Successfully redeemed {points_to_spend} points",
                    "current_points": customer_profile.points,
                }
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"])
    def my_points_history(self, request):
        """
        Get the points transaction history for the current user
        """
        try:
            customer_profile = CustomerProfile.objects.get(user=request.user)
        except CustomerProfile.DoesNotExist:
            return Response(
                {"error": "Customer profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get limit parameter with default of 10
        limit = int(request.query_params.get("limit", 10))
        transactions = PointsTransaction.objects.filter(
            customer=customer_profile
        ).order_by("-transaction_date")[:limit]

        serializer = PointsTransactionSerializer(transactions, many=True)
        return Response(serializer.data)


class PointsTransactionViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """
    API endpoint for viewing points transactions
    """

    serializer_class = PointsTransactionSerializer
    permission_classes = [IsStaffUser]
    filterset_fields = ["transaction_type", "customer__user"]
    search_fields = ["customer__user__email", "reference"]
    ordering_fields = ["transaction_date", "points"]

    def get_queryset(self):
        return PointsTransaction.objects.all().order_by("-transaction_date")
