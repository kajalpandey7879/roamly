import smtplib
from email.message import EmailMessage

from backend.app.core.config import settings


class EmailDeliveryError(RuntimeError):
    pass


class EmailService:
    def send_verification_code(self, recipient: str, code: str) -> None:
        if not settings.smtp_host or not settings.smtp_from_email:
            raise EmailDeliveryError(
                "Email delivery is not configured. Add SMTP settings to backend/.env."
            )

        message = EmailMessage()
        message["Subject"] = f"{code} is your Roamly verification code"
        message["From"] = settings.smtp_from_email
        message["To"] = recipient
        message.set_content(
            f"Your Roamly verification code is {code}. "
            "It expires in 10 minutes. If you did not request it, ignore this email."
        )
        message.add_alternative(
            f"""
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px">
              <h1 style="color:#e51d55">Roamly</h1>
              <p>Use this verification code to finish signing in:</p>
              <p style="font-size:34px;font-weight:700;letter-spacing:8px">{code}</p>
              <p>This code expires in 10 minutes. If you did not request it, ignore this email.</p>
            </div>
            """,
            subtype="html",
        )

        try:
            smtp_class = smtplib.SMTP_SSL if settings.smtp_use_ssl else smtplib.SMTP
            with smtp_class(settings.smtp_host, settings.smtp_port, timeout=12) as server:
                if not settings.smtp_use_ssl and settings.smtp_use_tls:
                    server.starttls()
                if settings.smtp_username:
                    server.login(settings.smtp_username, settings.smtp_password)
                server.send_message(message)
        except (OSError, smtplib.SMTPException) as error:
            raise EmailDeliveryError("We could not send the verification email.") from error


email_service = EmailService()
