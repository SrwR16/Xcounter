from datetime import timedelta

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


class CustomerTier(models.TextChoices):
    STANDARD = "STANDARD", "Standard"
    SILVER = "SILVER", "Silver"
    GOLD = "GOLD", "Gold"
    PLATINUM = "PLATINUM", "Platinum"
    VIP = "VIP", "VIP"


class TransactionType(models.TextChoices):
    EARNING = "EARNING", "Points Earned"
    SPENDING = "SPENDING", "Points Spent"
    ADJUSTMENT = "ADJUSTMENT", "Manual Adjustment"
    EXPIRY = "EXPIRY", "Points Expired"


class TierBenefit(models.Model):
    """Benefits associated with each loyalty tier"""

    tier = models.CharField(max_length=20, choices=CustomerTier.choices, unique=True)
    description = models.TextField(blank=True)

    # Discount percentage for this tier
    booking_discount = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Percentage discount on bookings",
    )

    # Number of free tickets per month
    monthly_free_tickets = models.PositiveIntegerField(
        default=0, help_text="Number of free tickets awarded monthly"
    )

    # Early access to ticket booking (in days before general release)
    early_booking_days = models.PositiveIntegerField(
        default=0, help_text="Days of early access to booking"
    )

    # Points multiplier for purchases
    points_multiplier = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=1.0,
        validators=[MinValueValidator(1.0)],
        help_text="Multiplier for points earning",
    )

    class Meta:
        ordering = ["tier"]
        verbose_name = "Tier Benefit"
        verbose_name_plural = "Tier Benefits"

    def __str__(self):
        return f"{self.get_tier_display()} Benefits"


class CustomerProfile(models.Model):
    """Extended profile for customers with loyalty information"""

    user = models.OneToOneField(
        "users.CustomUser", on_delete=models.CASCADE, related_name="loyalty_profile"
    )

    # Loyalty tier
    tier = models.CharField(
        max_length=20, choices=CustomerTier.choices, default=CustomerTier.STANDARD
    )

    # Optional manual tier override
    tier_override = models.CharField(
        max_length=20,
        choices=CustomerTier.choices,
        blank=True,
        null=True,
        help_text="Manually set customer tier (overrides automatic calculation)",
    )

    # Points earned
    points = models.PositiveIntegerField(default=0)

    # Lifetime spending
    lifetime_spending = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Free tickets
    free_tickets_remaining = models.PositiveIntegerField(default=0)
    free_tickets_reset_date = models.DateField(default=timezone.now)

    # Last tier check
    last_tier_check = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = "Customer Profile"
        verbose_name_plural = "Customer Profiles"
        indexes = [
            models.Index(fields=["tier"]),
            models.Index(fields=["lifetime_spending"]),
        ]

    def __str__(self):
        return f"{self.user.email}'s Loyalty Profile"

    def needs_tier_check(self):
        """Check if it's time to update tier (monthly)"""
        return timezone.now() > self.last_tier_check + timedelta(days=30)

    def update_tier(self):
        """Update customer tier based on spending"""
        previous_tier = self.tier

        # Skip tier calculation if there's a manual override
        if self.tier_override:
            self.tier = self.tier_override
        else:
            # Calculate based on lifetime spending
            if self.lifetime_spending >= 2500:
                new_tier = CustomerTier.VIP
            elif self.lifetime_spending >= 1000:
                new_tier = CustomerTier.PLATINUM
            elif self.lifetime_spending >= 500:
                new_tier = CustomerTier.GOLD
            elif self.lifetime_spending >= 100:
                new_tier = CustomerTier.SILVER
            else:
                new_tier = CustomerTier.STANDARD

            self.tier = new_tier

        # Update last check time
        self.last_tier_check = timezone.now()
        self.save(update_fields=["tier", "last_tier_check"])

        # Reset monthly benefits if tier changed
        if previous_tier != self.tier:
            self.reset_monthly_benefits()
            return True

        return False

    def reset_monthly_benefits(self):
        """Reset monthly benefits like free tickets"""
        try:
            tier_benefit = TierBenefit.objects.get(tier=self.tier)
            self.free_tickets_remaining = tier_benefit.monthly_free_tickets
            self.free_tickets_reset_date = (timezone.now() + timedelta(days=30)).date()
            self.save(
                update_fields=["free_tickets_remaining", "free_tickets_reset_date"]
            )
        except TierBenefit.DoesNotExist:
            pass

    def add_points(
        self,
        points,
        reference=None,
        transaction_type=TransactionType.EARNING,
        booking=None,
    ):
        """Add points to the customer account"""
        self.points += points
        self.save(update_fields=["points"])

        # Create transaction record
        PointsTransaction.objects.create(
            customer=self,
            transaction_type=transaction_type,
            points=points,
            reference=reference or "Points earned",
            booking=booking,
        )

        return points

    def reduce_points(
        self,
        points,
        reference=None,
        transaction_type=TransactionType.SPENDING,
        booking=None,
    ):
        """Reduce points from the customer account"""
        if points > self.points:
            points = self.points

        self.points -= points
        self.save(update_fields=["points"])

        # Create transaction record with negative points
        PointsTransaction.objects.create(
            customer=self,
            transaction_type=transaction_type,
            points=-points,  # Negative for spending
            reference=reference or "Points spent",
            booking=booking,
        )

        return points

    def add_spending(self, amount, booking=None):
        """Add to lifetime spending and update points"""
        previous_spending = self.lifetime_spending
        self.lifetime_spending += amount

        # Get points multiplier based on tier
        try:
            tier_benefit = TierBenefit.objects.get(tier=self.tier)
            multiplier = tier_benefit.points_multiplier
        except TierBenefit.DoesNotExist:
            multiplier = 1.0

        # Calculate points (10 points per dollar spent, multiplied by tier multiplier)
        points_to_add = int(amount * 10 * multiplier)

        # Add points with reference
        reference = f"Purchase: ${amount}"
        if booking:
            reference = f"Booking #{booking.booking_number}: ${amount}"

        self.add_points(points_to_add, reference=reference, booking=booking)

        # Save updated spending
        self.save(update_fields=["lifetime_spending"])

        # Check if tier needs updating
        if self.needs_tier_check():
            self.update_tier()

        return points_to_add


class PointsTransaction(models.Model):
    """Record of customer points transactions"""

    customer = models.ForeignKey(
        CustomerProfile, on_delete=models.CASCADE, related_name="transactions"
    )
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    points = models.IntegerField()  # Positive for earnings, negative for spendings
    reference = models.CharField(max_length=255, blank=True, null=True)
    booking = models.ForeignKey(
        "bookings.Booking", on_delete=models.SET_NULL, null=True, blank=True
    )
    transaction_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-transaction_date"]
        indexes = [
            models.Index(fields=["-transaction_date"]),
            models.Index(fields=["customer", "transaction_type"]),
        ]

    def __str__(self):
        return f"{self.get_transaction_type_display()}: {self.points} points for {self.customer.user.email}"


@receiver(post_save, sender="users.CustomUser")
def create_customer_profile(sender, instance, created, **kwargs):
    """Create a customer loyalty profile for new users"""
    if created:
        CustomerProfile.objects.create(user=instance)
