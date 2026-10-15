"""Outgoing email over SMTP.

Without ``MVC_SMTP_HOST`` nothing is sent: the message is logged and kept in
``OUTBOX`` (dev and tests read verification links from there).
"""
from __future__ import annotations

import logging
import smtplib
import ssl
from collections import deque
from dataclasses import dataclass
from email.message import EmailMessage
from email.utils import formataddr, parseaddr

from app.core.config import get_settings

logger = logging.getLogger("mvCalc.mail")


@dataclass
class SentMail:
    to: str
    subject: str
    text: str
    html: str


OUTBOX: deque[SentMail] = deque(maxlen=50)


def send_email(to: str, subject: str, text: str, html: str) -> bool:
    """Send one message; False (and a log entry) when delivery fails."""
    s = get_settings()
    if not s.smtp_host:
        OUTBOX.append(SentMail(to, subject, text, html))
        logger.warning("SMTP not configured — email to %s not sent.\nSubject: %s\n%s", to, subject, text)
        return True

    msg = EmailMessage()
    name, addr = parseaddr(s.smtp_from)
    msg["From"] = formataddr((name, addr))
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")

    try:
        if s.smtp_ssl:
            server: smtplib.SMTP = smtplib.SMTP_SSL(s.smtp_host, s.smtp_port, timeout=15, context=ssl.create_default_context())
        else:
            server = smtplib.SMTP(s.smtp_host, s.smtp_port, timeout=15)
        with server:
            if s.smtp_starttls and not s.smtp_ssl:
                server.starttls(context=ssl.create_default_context())
            if s.smtp_user:
                server.login(s.smtp_user, s.smtp_password)
            server.send_message(msg)
        return True
    except (OSError, smtplib.SMTPException):
        logger.exception("Failed to send email to %s", to)
        return False


def render(title: str, intro: str, button: str, link: str, outro: str) -> tuple[str, str]:
    """(text, html) bodies for a single-call-to-action email."""
    text = f"{title}\n\n{intro}\n\n{button}: {link}\n\n{outro}\n\n— Vision Studio"
    html = f"""<!doctype html>
<html><body style="margin:0;padding:24px;background:#0B0E14;font-family:Segoe UI,Arial,sans-serif;color:#E2E8F0">
  <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#141822;border:1px solid #232a38;border-radius:12px">
    <tr><td style="padding:28px 32px">
      <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#8B5CF6;text-transform:uppercase">Vision Studio</div>
      <h1 style="font-size:20px;margin:8px 0 16px">{title}</h1>
      <p style="font-size:14px;line-height:1.6;color:#CBD5E1">{intro}</p>
      <p style="margin:24px 0">
        <a href="{link}" style="display:inline-block;padding:12px 22px;border-radius:8px;background:#3B82F6;color:#fff;text-decoration:none;font-weight:600">{button}</a>
      </p>
      <p style="font-size:12px;line-height:1.6;color:#94A3B8">{outro}</p>
      <p style="font-size:11px;color:#64748B;word-break:break-all">{link}</p>
    </td></tr>
  </table>
</body></html>"""
    return text, html
