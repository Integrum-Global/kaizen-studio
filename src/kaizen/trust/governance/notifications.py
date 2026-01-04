"""
Approval Notification Module

Provides notification service and adapters for sending approval
notifications through various channels:
- Email
- Slack
- Microsoft Teams
- Webhook (generic)

Examples:
    >>> service = ApprovalNotificationService()
    >>> service.register_adapter("email", EmailNotificationAdapter(smtp_config))
    >>> service.register_adapter("slack", SlackNotificationAdapter(webhook_url))
    >>> await service.notify_approvers(request, roles=["admin"], users=[])
"""

import json
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Protocol

logger = logging.getLogger(__name__)


@dataclass
class ApproverInfo:
    """Information about an approver."""

    user_id: str
    email: str | None = None
    name: str | None = None
    notification_channels: list[str] = field(default_factory=lambda: ["email"])


class ApproverResolver(Protocol):
    """Protocol for resolving approvers from roles and user IDs."""

    async def resolve_approvers(
        self,
        roles: list[str],
        users: list[str],
        organization_id: str
    ) -> list[ApproverInfo]:
        """Resolve approver information from roles and user IDs."""
        ...


class NotificationAdapter(ABC):
    """Base class for notification adapters."""

    @abstractmethod
    async def send_approval_request(
        self,
        request: Any,
        approver: ApproverInfo,
        approval_url: str | None = None
    ) -> bool:
        """
        Send approval request notification.

        Args:
            request: The ApprovalRequest object
            approver: Approver information
            approval_url: Optional URL for approving/rejecting

        Returns:
            True if notification was sent successfully
        """
        ...

    @abstractmethod
    async def send_decision_notification(
        self,
        request: Any,
        recipient: ApproverInfo,
        decision: str,
        reason: str | None
    ) -> bool:
        """
        Send notification about an approval decision.

        Args:
            request: The ApprovalRequest object
            recipient: Recipient information
            decision: "approved", "rejected", or "expired"
            reason: Reason for the decision

        Returns:
            True if notification was sent successfully
        """
        ...


class EmailNotificationAdapter(NotificationAdapter):
    """
    Email notification adapter.

    Sends approval notifications via email.

    Examples:
        >>> adapter = EmailNotificationAdapter(
        ...     smtp_host="smtp.example.com",
        ...     smtp_port=587,
        ...     username="notifications@example.com",
        ...     password="secret",
        ...     from_address="approvals@example.com"
        ... )
    """

    def __init__(
        self,
        smtp_host: str = "localhost",
        smtp_port: int = 25,
        username: str | None = None,
        password: str | None = None,
        from_address: str = "approvals@example.com",
        use_tls: bool = True,
        base_url: str = "https://studio.example.com"
    ):
        """Initialize email adapter."""
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.username = username
        self.password = password
        self.from_address = from_address
        self.use_tls = use_tls
        self.base_url = base_url

    async def send_approval_request(
        self,
        request: Any,
        approver: ApproverInfo,
        approval_url: str | None = None
    ) -> bool:
        """Send approval request email."""
        if not approver.email:
            logger.warning(f"No email for approver {approver.user_id}")
            return False

        approval_link = approval_url or f"{self.base_url}/approvals/{request.id}"

        subject = f"[Action Required] Approval Request: {request.external_agent_id}"
        body = self._format_request_email(request, approval_link)

        try:
            await self._send_email(
                to_address=approver.email,
                subject=subject,
                body=body
            )
            logger.info(f"Sent approval email to {approver.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {approver.email}: {e}")
            return False

    async def send_decision_notification(
        self,
        request: Any,
        recipient: ApproverInfo,
        decision: str,
        reason: str | None
    ) -> bool:
        """Send decision notification email."""
        if not recipient.email:
            return False

        subject = f"[Approval {decision.title()}] {request.external_agent_id}"
        body = self._format_decision_email(request, decision, reason)

        try:
            await self._send_email(
                to_address=recipient.email,
                subject=subject,
                body=body
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send decision email: {e}")
            return False

    def _format_request_email(self, request: Any, approval_link: str) -> str:
        """Format approval request email body."""
        return f"""
An approval is required for an external agent invocation.

Request Details:
- Request ID: {request.id}
- Agent: {request.external_agent_id}
- Requested By: {request.requested_by_user_id}
- Reason: {request.trigger_reason}
- Estimated Cost: ${request.estimated_cost or 0:.2f}
- Expires: {request.expires_at.isoformat() if request.expires_at else 'N/A'}

Payload Summary:
{request.payload_summary}

To approve or reject this request, visit:
{approval_link}

---
This is an automated message from Kaizen Studio.
        """.strip()

    def _format_decision_email(
        self,
        request: Any,
        decision: str,
        reason: str | None
    ) -> str:
        """Format decision notification email."""
        return f"""
Your approval request has been {decision}.

Request Details:
- Request ID: {request.id}
- Agent: {request.external_agent_id}
- Status: {decision.upper()}
{f'- Reason: {reason}' if reason else ''}

---
This is an automated message from Kaizen Studio.
        """.strip()

    async def _send_email(
        self,
        to_address: str,
        subject: str,
        body: str
    ) -> None:
        """Send email using SMTP."""
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        msg = MIMEMultipart()
        msg["From"] = self.from_address
        msg["To"] = to_address
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
            if self.use_tls:
                server.starttls()
            if self.username and self.password:
                server.login(self.username, self.password)
            server.send_message(msg)


class SlackNotificationAdapter(NotificationAdapter):
    """
    Slack notification adapter using incoming webhooks.

    Examples:
        >>> adapter = SlackNotificationAdapter(
        ...     webhook_url="https://hooks.slack.com/services/...",
        ...     channel="#approvals"
        ... )
    """

    def __init__(
        self,
        webhook_url: str,
        channel: str | None = None,
        base_url: str = "https://studio.example.com"
    ):
        """Initialize Slack adapter."""
        self.webhook_url = webhook_url
        self.channel = channel
        self.base_url = base_url

    async def send_approval_request(
        self,
        request: Any,
        approver: ApproverInfo,
        approval_url: str | None = None
    ) -> bool:
        """Send approval request to Slack."""
        approval_link = approval_url or f"{self.base_url}/approvals/{request.id}"

        payload = {
            "channel": self.channel,
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": "🔔 Approval Required"
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        {"type": "mrkdwn", "text": f"*Agent:*\n{request.external_agent_id}"},
                        {"type": "mrkdwn", "text": f"*Requested By:*\n{request.requested_by_user_id}"},
                        {"type": "mrkdwn", "text": f"*Estimated Cost:*\n${request.estimated_cost or 0:.2f}"},
                        {"type": "mrkdwn", "text": f"*Expires:*\n{request.expires_at.strftime('%Y-%m-%d %H:%M') if request.expires_at else 'N/A'}"}
                    ]
                },
                {
                    "type": "section",
                    "text": {"type": "mrkdwn", "text": f"*Reason:*\n{request.trigger_reason}"}
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {"type": "plain_text", "text": "✅ Approve"},
                            "style": "primary",
                            "url": f"{approval_link}?action=approve"
                        },
                        {
                            "type": "button",
                            "text": {"type": "plain_text", "text": "❌ Reject"},
                            "style": "danger",
                            "url": f"{approval_link}?action=reject"
                        },
                        {
                            "type": "button",
                            "text": {"type": "plain_text", "text": "View Details"},
                            "url": approval_link
                        }
                    ]
                }
            ]
        }

        try:
            return await self._post_webhook(payload)
        except Exception as e:
            logger.error(f"Failed to send Slack notification: {e}")
            return False

    async def send_decision_notification(
        self,
        request: Any,
        recipient: ApproverInfo,
        decision: str,
        reason: str | None
    ) -> bool:
        """Send decision notification to Slack."""
        emoji = "✅" if decision == "approved" else "❌" if decision == "rejected" else "⏰"

        payload = {
            "channel": self.channel,
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"{emoji} *Approval Request {decision.title()}*\n"
                                f"Request `{request.id}` for agent `{request.external_agent_id}` "
                                f"has been {decision}."
                                f"{f'\n_Reason: {reason}_' if reason else ''}"
                    }
                }
            ]
        }

        try:
            return await self._post_webhook(payload)
        except Exception as e:
            logger.error(f"Failed to send Slack decision notification: {e}")
            return False

    async def _post_webhook(self, payload: dict[str, Any]) -> bool:
        """Post to Slack webhook."""
        import aiohttp

        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    return True
                else:
                    text = await response.text()
                    logger.error(f"Slack webhook error: {response.status} - {text}")
                    return False


class TeamsNotificationAdapter(NotificationAdapter):
    """
    Microsoft Teams notification adapter using incoming webhooks.

    Examples:
        >>> adapter = TeamsNotificationAdapter(
        ...     webhook_url="https://outlook.office.com/webhook/..."
        ... )
    """

    def __init__(
        self,
        webhook_url: str,
        base_url: str = "https://studio.example.com"
    ):
        """Initialize Teams adapter."""
        self.webhook_url = webhook_url
        self.base_url = base_url

    async def send_approval_request(
        self,
        request: Any,
        approver: ApproverInfo,
        approval_url: str | None = None
    ) -> bool:
        """Send approval request to Teams."""
        approval_link = approval_url or f"{self.base_url}/approvals/{request.id}"

        payload = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": "0076D7",
            "summary": f"Approval Required: {request.external_agent_id}",
            "sections": [
                {
                    "activityTitle": "🔔 Approval Required",
                    "facts": [
                        {"name": "Agent", "value": request.external_agent_id},
                        {"name": "Requested By", "value": request.requested_by_user_id},
                        {"name": "Estimated Cost", "value": f"${request.estimated_cost or 0:.2f}"},
                        {"name": "Reason", "value": request.trigger_reason},
                        {"name": "Expires", "value": request.expires_at.strftime("%Y-%m-%d %H:%M") if request.expires_at else "N/A"}
                    ],
                    "markdown": True
                }
            ],
            "potentialAction": [
                {
                    "@type": "OpenUri",
                    "name": "View Request",
                    "targets": [{"os": "default", "uri": approval_link}]
                }
            ]
        }

        try:
            return await self._post_webhook(payload)
        except Exception as e:
            logger.error(f"Failed to send Teams notification: {e}")
            return False

    async def send_decision_notification(
        self,
        request: Any,
        recipient: ApproverInfo,
        decision: str,
        reason: str | None
    ) -> bool:
        """Send decision notification to Teams."""
        color = "00FF00" if decision == "approved" else "FF0000" if decision == "rejected" else "FFA500"

        payload = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": color,
            "summary": f"Approval {decision.title()}: {request.external_agent_id}",
            "sections": [
                {
                    "activityTitle": f"Approval Request {decision.title()}",
                    "text": f"Request `{request.id}` for agent `{request.external_agent_id}` has been {decision}."
                           f"{f' Reason: {reason}' if reason else ''}",
                    "markdown": True
                }
            ]
        }

        try:
            return await self._post_webhook(payload)
        except Exception as e:
            logger.error(f"Failed to send Teams decision notification: {e}")
            return False

    async def _post_webhook(self, payload: dict[str, Any]) -> bool:
        """Post to Teams webhook."""
        import aiohttp

        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    return True
                else:
                    text = await response.text()
                    logger.error(f"Teams webhook error: {response.status} - {text}")
                    return False


class WebhookNotificationAdapter(NotificationAdapter):
    """
    Generic webhook notification adapter.

    Sends notifications to a custom webhook endpoint.

    Examples:
        >>> adapter = WebhookNotificationAdapter(
        ...     webhook_url="https://api.example.com/webhooks/approvals",
        ...     secret="webhook-secret"
        ... )
    """

    def __init__(
        self,
        webhook_url: str,
        secret: str | None = None,
        headers: dict[str, str] | None = None
    ):
        """Initialize webhook adapter."""
        self.webhook_url = webhook_url
        self.secret = secret
        self.headers = headers or {}

    async def send_approval_request(
        self,
        request: Any,
        approver: ApproverInfo,
        approval_url: str | None = None
    ) -> bool:
        """Send approval request webhook."""
        payload = {
            "event": "approval.request_created",
            "timestamp": datetime.utcnow().isoformat(),
            "request": {
                "id": request.id,
                "external_agent_id": request.external_agent_id,
                "organization_id": request.organization_id,
                "requested_by_user_id": request.requested_by_user_id,
                "trigger_reason": request.trigger_reason,
                "estimated_cost": request.estimated_cost,
                "expires_at": request.expires_at.isoformat() if request.expires_at else None
            },
            "approver": {
                "user_id": approver.user_id,
                "email": approver.email
            }
        }

        return await self._post_webhook(payload)

    async def send_decision_notification(
        self,
        request: Any,
        recipient: ApproverInfo,
        decision: str,
        reason: str | None
    ) -> bool:
        """Send decision webhook."""
        payload = {
            "event": f"approval.{decision}",
            "timestamp": datetime.utcnow().isoformat(),
            "request": {
                "id": request.id,
                "external_agent_id": request.external_agent_id,
                "organization_id": request.organization_id
            },
            "decision": decision,
            "reason": reason
        }

        return await self._post_webhook(payload)

    async def _post_webhook(self, payload: dict[str, Any]) -> bool:
        """Post to webhook endpoint."""
        import aiohttp
        import hashlib
        import hmac

        headers = {"Content-Type": "application/json", **self.headers}

        # Add signature if secret is configured
        if self.secret:
            body = json.dumps(payload)
            signature = hmac.new(
                self.secret.encode(),
                body.encode(),
                hashlib.sha256
            ).hexdigest()
            headers["X-Webhook-Signature"] = f"sha256={signature}"

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.webhook_url,
                    json=payload,
                    headers=headers
                ) as response:
                    return response.status < 400
        except Exception as e:
            logger.error(f"Webhook error: {e}")
            return False


class SimpleApproverResolver:
    """
    Simple approver resolver that creates ApproverInfo from user IDs.

    For testing and simple deployments where user lookup isn't needed.
    """

    def __init__(self, user_emails: dict[str, str] | None = None):
        """
        Initialize resolver.

        Args:
            user_emails: Mapping of user IDs to email addresses
        """
        self.user_emails = user_emails or {}

    async def resolve_approvers(
        self,
        roles: list[str],
        users: list[str],
        organization_id: str
    ) -> list[ApproverInfo]:
        """Resolve approvers from user list."""
        approvers = []

        for user_id in users:
            approvers.append(ApproverInfo(
                user_id=user_id,
                email=self.user_emails.get(user_id),
                notification_channels=["email", "slack"]
            ))

        return approvers


class ApprovalNotificationService:
    """
    Multi-channel notification service for approvals.

    Coordinates sending notifications across multiple channels.

    Examples:
        >>> service = ApprovalNotificationService()
        >>> service.register_adapter("email", EmailNotificationAdapter(...))
        >>> service.register_adapter("slack", SlackNotificationAdapter(...))

        >>> await service.notify_approvers(
        ...     request=request,
        ...     approver_roles=["admin"],
        ...     approver_users=["user-001"]
        ... )
    """

    def __init__(
        self,
        approver_resolver: ApproverResolver | None = None,
        base_url: str = "https://studio.example.com"
    ):
        """Initialize notification service."""
        self.adapters: dict[str, NotificationAdapter] = {}
        self.approver_resolver = approver_resolver or SimpleApproverResolver()
        self.base_url = base_url

    def register_adapter(self, channel: str, adapter: NotificationAdapter) -> None:
        """Register a notification adapter for a channel."""
        self.adapters[channel] = adapter

    async def notify_approvers(
        self,
        request: Any,
        approver_roles: list[str],
        approver_users: list[str]
    ) -> dict[str, bool]:
        """
        Send notifications to all approvers.

        Args:
            request: ApprovalRequest to notify about
            approver_roles: Roles whose members should be notified
            approver_users: Specific user IDs to notify

        Returns:
            Dict mapping approver IDs to success status
        """
        results: dict[str, bool] = {}

        # Resolve approvers
        approvers = await self.approver_resolver.resolve_approvers(
            roles=approver_roles,
            users=approver_users,
            organization_id=request.organization_id
        )

        approval_url = f"{self.base_url}/approvals/{request.id}"

        for approver in approvers:
            success = False

            for channel in approver.notification_channels:
                adapter = self.adapters.get(channel)
                if adapter:
                    try:
                        if await adapter.send_approval_request(
                            request=request,
                            approver=approver,
                            approval_url=approval_url
                        ):
                            success = True
                            break  # Stop after first successful notification
                    except Exception as e:
                        logger.error(f"Failed to send {channel} notification: {e}")

            results[approver.user_id] = success

        return results

    async def notify_requestor(
        self,
        request: Any,
        decision: str,
        reason: str | None
    ) -> bool:
        """
        Notify the requestor of a decision.

        Args:
            request: ApprovalRequest
            decision: "approved", "rejected", or "expired"
            reason: Reason for the decision

        Returns:
            True if notification was sent successfully
        """
        # Create approver info for requestor
        requestor = ApproverInfo(
            user_id=request.requested_by_user_id,
            notification_channels=["email", "slack"]
        )

        for channel in requestor.notification_channels:
            adapter = self.adapters.get(channel)
            if adapter:
                try:
                    if await adapter.send_decision_notification(
                        request=request,
                        recipient=requestor,
                        decision=decision,
                        reason=reason
                    ):
                        return True
                except Exception as e:
                    logger.error(f"Failed to send decision notification: {e}")

        return False


__all__ = [
    "ApproverInfo",
    "ApproverResolver",
    "NotificationAdapter",
    "EmailNotificationAdapter",
    "SlackNotificationAdapter",
    "TeamsNotificationAdapter",
    "WebhookNotificationAdapter",
    "SimpleApproverResolver",
    "ApprovalNotificationService",
]
