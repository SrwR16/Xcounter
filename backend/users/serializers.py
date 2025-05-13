from django.contrib.auth import authenticate
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework.authtoken.models import Token

from .models import CustomUser, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = (
            "full_name",
            "phone_number",
            "address",
            "profile_picture",
            "date_of_birth",
            "employee_id",
            "department",
            "hire_date",
        )
        read_only_fields = ("employee_id",)


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = CustomUser
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "date_joined",
            "is_email_verified",
            "profile",
        )
        read_only_fields = ("id", "is_active", "date_joined", "is_email_verified")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, style={"input_type": "password"}
    )
    password_confirm = serializers.CharField(
        write_only=True, required=True, style={"input_type": "password"}
    )
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = CustomUser
        fields = ("email", "password", "password_confirm", "role", "profile")

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": _("Passwords don't match.")}
            )

        # Only admin and moderator can create other admins or moderators
        request = self.context.get("request")
        if request and not hasattr(request, "user"):
            # If it's an anonymous registration, only customer role is allowed
            if attrs.get("role") and attrs["role"] != "CUSTOMER":
                attrs["role"] = "CUSTOMER"
        elif request and request.user and request.user.is_authenticated:
            # Only admin can create admins
            if attrs.get("role") == "ADMIN" and not request.user.is_admin:
                raise serializers.ValidationError(
                    {"role": _("Only admins can create admin accounts.")}
                )
            # Only admin and moderator can create moderators
            elif attrs.get("role") == "MODERATOR" and not (
                request.user.is_admin or request.user.is_moderator
            ):
                raise serializers.ValidationError(
                    {
                        "role": _(
                            "Only admins or moderators can create moderator accounts."
                        )
                    }
                )
            # Only admin and moderator can create salesmen
            elif attrs.get("role") == "SALESMAN" and not (
                request.user.is_admin or request.user.is_moderator
            ):
                raise serializers.ValidationError(
                    {
                        "role": _(
                            "Only admins or moderators can create salesman accounts."
                        )
                    }
                )

        return attrs

    def create(self, validated_data):
        profile_data = validated_data.pop("profile", {})
        user = CustomUser.objects.create_user(**validated_data)

        # Make sure profile exists before trying to update it
        try:
            if not hasattr(user, "profile"):
                from users.models import UserProfile

                profile = UserProfile.objects.create(user=user)
            else:
                profile = user.profile

            # Update profile data if provided
            if profile_data:
                for attr, value in profile_data.items():
                    setattr(profile, attr, value)
                profile.save()
        except Exception as e:
            # Log the error but don't fail the registration
            print(f"Error updating profile: {e}")

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True, write_only=True, style={"input_type": "password"}
    )
    token = serializers.CharField(read_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs["email"], password=attrs["password"])

        if not user:
            raise serializers.ValidationError(_("Invalid email or password."))

        if not user.is_active:
            raise serializers.ValidationError(_("User account is disabled."))

        # Check for email verification if required
        # if settings.EMAIL_VERIFICATION_REQUIRED and not user.is_email_verified:
        #     raise serializers.ValidationError(_("Email is not verified."))

        # Get or create token
        token, created = Token.objects.get_or_create(user=user)

        return {"email": user.email, "token": token.key, "user": user}


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(
        required=True, write_only=True, style={"input_type": "password"}
    )
    new_password = serializers.CharField(
        required=True, write_only=True, style={"input_type": "password"}
    )
    new_password_confirm = serializers.CharField(
        required=True, write_only=True, style={"input_type": "password"}
    )

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": _("Passwords don't match.")}
            )
        return attrs

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError(_("Old password is not correct."))
        return value
