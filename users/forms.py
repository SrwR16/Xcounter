from django import forms
from django.contrib.auth.forms import UserCreationForm

from .models import CustomUser


class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(
        required=True, help_text="Required. Enter a valid email address."
    )

    class Meta:
        model = CustomUser
        fields = ("email", "password1", "password2")


class TwoFactorVerificationForm(forms.Form):
    """
    Form for validating 2FA verification codes.
    """

    code = forms.CharField(
        max_length=6,
        min_length=6,
        required=True,
        widget=forms.TextInput(
            attrs={"class": "form-control", "placeholder": "Enter 6-digit code"}
        ),
    )

    def clean_code(self):
        code = self.cleaned_data.get("code")
        if not code.isdigit():
            raise forms.ValidationError("Code must contain only digits")
        return code
