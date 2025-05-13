from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from .tokens import email_verification_token


def send_verification_email(request, user):
    """
    Send email verification email to user
    """
    current_site = get_current_site(request)
    mail_subject = "Activate your XCounter account"
    message = render_to_string(
        "users/email_verification_email.html",
        {
            "user": user,
            "domain": current_site.domain,
            "uid": urlsafe_base64_encode(force_bytes(user.pk)),
            "token": email_verification_token.make_token(user),
            "protocol": "https" if request.is_secure() else "http",
        },
    )
    text_content = "Please activate your account by clicking the link."
    email = EmailMultiAlternatives(mail_subject, text_content, to=[user.email])
    email.attach_alternative(message, "text/html")
    return email.send()


def send_password_reset_email(request, user):
    """
    Send password reset email to user
    """
    current_site = get_current_site(request)
    mail_subject = "Reset your XCounter password"
    message = render_to_string(
        "users/password_reset_email.html",
        {
            "user": user,
            "domain": current_site.domain,
            "uid": urlsafe_base64_encode(force_bytes(user.pk)),
            "token": email_verification_token.make_token(user),
            "protocol": "https" if request.is_secure() else "http",
        },
    )
    text_content = "Please reset your password by clicking the link."
    email = EmailMultiAlternatives(mail_subject, text_content, to=[user.email])
    email.attach_alternative(message, "text/html")
    return email.send()


def send_welcome_email(user):
    """
    Send welcome email after verification
    """
    mail_subject = "Welcome to XCounter!"
    message = render_to_string(
        "users/welcome_email.html",
        {
            "user": user,
        },
    )
    text_content = "Welcome to XCounter!"
    email = EmailMultiAlternatives(mail_subject, text_content, to=[user.email])
    email.attach_alternative(message, "text/html")
    return email.send()
