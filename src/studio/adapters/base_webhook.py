"""
Base Webhook Adapter

Abstract base class for platform-specific webhook adapters (Teams, Discord, Slack, Telegram, Notion).
Provides common authentication, retry logic, and delivery tracking.
"""

import asyncio
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass

import httpx


@dataclass
class DeliveryResult:
    """
    Result of webhook delivery attempt.

    Attributes:
        success: Whether delivery succeeded
        status_code: HTTP status code (if applicable)
        error_message: Error details if failed
        retry_count: Number of retry attempts made
        duration_ms: Delivery duration in milliseconds
    """

    success: bool
    status_code: int | None = None
    error_message: str | None = None
    retry_count: int = 0
    duration_ms: int = 0


class BaseWebhookAdapter(ABC):
    """
    Base adapter for platform-specific webhook delivery.

    All platform adapters (Teams, Discord, Slack, Telegram, Notion) must inherit
    from this class and implement the abstract methods.

    Common functionality:
    - Authentication header generation
    - Retry logic with exponential backoff (3 attempts: 1s, 2s, 4s)
    - Error handling and sanitization
    - Delivery tracking

    Platform-specific functionality (must implement):
    - format_payload(): Convert invocation result to platform format
    - deliver(): Execute delivery to platform endpoint
    """

    # Retry configuration
    MAX_RETRY_ATTEMPTS = 3
    RETRY_DELAYS = [1, 2, 4]  # Seconds (exponential backoff)

    def __init__(self, auth_config: dict, platform_config: dict):
        """
        Initialize the webhook adapter.

        Args:
            auth_config: Authentication configuration
                - auth_type: "api_key", "oauth2", "bearer_token", "custom", "none"
                - credentials: Platform-specific auth credentials (encrypted)
            platform_config: Platform-specific configuration
                - webhook_url: Target webhook URL
                - Additional platform-specific settings
        """
        self.auth_config = auth_config
        self.platform_config = platform_config

    @abstractmethod
    def format_payload(self, invocation_result: dict) -> dict:
        """
        Format invocation result for platform-specific format.

        Args:
            invocation_result: External agent invocation result
                - id: Invocation ID
                - external_agent_id: Agent ID
                - request_payload: Original request
                - response_payload: Agent response
                - status: "success" or "failed"
                - execution_time_ms: Execution time
                - error_message: Error details if failed
                - invoked_at: Invocation timestamp
                - completed_at: Completion timestamp

        Returns:
            Platform-specific payload dictionary

        Raises:
            ValueError: If invocation_result is invalid
        """
        pass

    @abstractmethod
    async def deliver(self, payload: dict) -> DeliveryResult:
        """
        Deliver payload to platform webhook endpoint.

        Args:
            payload: Platform-specific payload (from format_payload)

        Returns:
            DeliveryResult with success status and metadata

        Raises:
            httpx.HTTPError: If delivery fails after all retries
        """
        pass

    def _get_auth_headers(self) -> dict:
        """
        Get authentication headers based on auth_type.

        Returns:
            Dictionary of HTTP headers

        Supported auth types:
        - api_key: X-API-Key header or custom header name
        - oauth2: Authorization: Bearer {token}
        - bearer_token: Authorization: Bearer {token}
        - custom: Arbitrary headers from auth_config
        - none: No authentication headers
        """
        auth_type = self.auth_config.get("auth_type", "none")
        credentials = self.auth_config.get("credentials", {})

        if auth_type == "api_key":
            # Support custom header name or default to X-API-Key
            header_name = credentials.get("header_name", "X-API-Key")
            api_key = credentials.get("api_key", "")
            return {header_name: api_key}

        elif auth_type in ["oauth2", "bearer_token"]:
            token = credentials.get("token", "")
            return {"Authorization": f"Bearer {token}"}

        elif auth_type == "custom":
            # Custom headers from auth_config
            return credentials.get("headers", {})

        else:
            # No authentication
            return {}

    async def _retry_delivery(
        self,
        payload: dict,
        max_attempts: int | None = None,
    ) -> DeliveryResult:
        """
        Retry delivery with exponential backoff.

        Args:
            payload: Platform-specific payload
            max_attempts: Maximum retry attempts (defaults to MAX_RETRY_ATTEMPTS)

        Returns:
            DeliveryResult from final attempt

        Retry logic:
        - Attempt 1: Immediate
        - Attempt 2: After 1 second
        - Attempt 3: After 2 seconds
        - Attempt 4: After 4 seconds
        """
        max_attempts = max_attempts or self.MAX_RETRY_ATTEMPTS
        last_result = None

        for attempt in range(max_attempts):
            # Wait before retry (skip on first attempt)
            if attempt > 0:
                delay = self.RETRY_DELAYS[min(attempt - 1, len(self.RETRY_DELAYS) - 1)]
                await asyncio.sleep(delay)

            try:
                # Attempt delivery
                result = await self.deliver(payload)
                result.retry_count = attempt

                # Return on success
                if result.success:
                    return result

                # Store last result for final return
                last_result = result

            except Exception as e:
                # Catch all exceptions and convert to DeliveryResult
                last_result = DeliveryResult(
                    success=False,
                    error_message=self._sanitize_error_message(str(e)),
                    retry_count=attempt,
                )

        # All retries failed - return last result
        if last_result is None:
            last_result = DeliveryResult(
                success=False,
                error_message="Delivery failed after all retries",
                retry_count=max_attempts,
            )

        return last_result

    def _sanitize_error_message(self, error_message: str) -> str:
        """
        Sanitize error message to remove sensitive data.

        Removes:
        - API keys
        - OAuth tokens
        - Bearer tokens
        - Passwords
        - Secret values

        Args:
            error_message: Raw error message

        Returns:
            Sanitized error message
        """
        # Remove common auth patterns
        sanitized = error_message

        # Replace API key patterns
        import re

        sanitized = re.sub(
            r"api[_-]?key[:\s=]*['\"]?[\w\-]{10,}['\"]?",
            "api_key=<REDACTED>",
            sanitized,
            flags=re.IGNORECASE,
        )

        # Replace Bearer tokens
        sanitized = re.sub(
            r"Bearer\s+[\w\-\.]{20,}",
            "Bearer <REDACTED>",
            sanitized,
            flags=re.IGNORECASE,
        )

        # Replace Authorization headers
        sanitized = re.sub(
            r"Authorization[:\s]+['\"]?[\w\s\-\.]{20,}['\"]?",
            "Authorization: <REDACTED>",
            sanitized,
            flags=re.IGNORECASE,
        )

        # Replace secret patterns
        sanitized = re.sub(
            r"secret[:\s]*['\"]?[\w\-]{20,}['\"]?",
            "secret=<REDACTED>",
            sanitized,
            flags=re.IGNORECASE,
        )

        # Replace password patterns
        sanitized = re.sub(
            r"password[:\s]*['\"]?[\w\-]{8,}['\"]?",
            "password=<REDACTED>",
            sanitized,
            flags=re.IGNORECASE,
        )

        return sanitized

    async def _execute_http_delivery(
        self,
        url: str,
        payload: dict,
        headers: dict | None = None,
        method: str = "POST",
        timeout: float = 30.0,
    ) -> DeliveryResult:
        """
        Execute HTTP delivery with timing and error handling.

        Args:
            url: Target URL
            payload: JSON payload
            headers: HTTP headers (will merge with auth headers)
            method: HTTP method (default: POST)
            timeout: Request timeout in seconds

        Returns:
            DeliveryResult with status and timing
        """
        start_time = time.time()

        try:
            # Merge auth headers with provided headers
            auth_headers = self._get_auth_headers()
            final_headers = {**auth_headers, **(headers or {})}

            # Execute HTTP request
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.request(
                    method=method,
                    url=url,
                    json=payload,
                    headers=final_headers,
                )

                # Calculate duration
                duration_ms = int((time.time() - start_time) * 1000)

                # Check success (2xx status codes)
                success = 200 <= response.status_code < 300

                return DeliveryResult(
                    success=success,
                    status_code=response.status_code,
                    error_message=response.text if not success else None,
                    duration_ms=duration_ms,
                )

        except httpx.TimeoutException:
            duration_ms = int((time.time() - start_time) * 1000)
            return DeliveryResult(
                success=False,
                status_code=None,
                error_message=f"Request timeout after {timeout}s",
                duration_ms=duration_ms,
            )

        except httpx.HTTPError as e:
            duration_ms = int((time.time() - start_time) * 1000)
            return DeliveryResult(
                success=False,
                status_code=None,
                error_message=self._sanitize_error_message(str(e)),
                duration_ms=duration_ms,
            )

        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            return DeliveryResult(
                success=False,
                status_code=None,
                error_message=self._sanitize_error_message(str(e)),
                duration_ms=duration_ms,
            )
