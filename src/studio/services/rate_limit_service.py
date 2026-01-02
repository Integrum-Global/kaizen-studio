"""
Rate Limit Service

Business logic for rate limiting using Redis sliding window algorithm.
Uses Redis for efficient, ephemeral rate limit tracking with automatic expiration.
"""

import logging
from datetime import UTC, datetime, timedelta

import redis

from studio.config import get_redis_url

logger = logging.getLogger(__name__)


class RateLimitService:
    """
    Service for managing rate limits using Redis.

    Uses sliding window algorithm with 1-minute windows.
    Redis provides atomic operations and automatic key expiration.
    """

    def __init__(self):
        """Initialize the rate limit service with Redis connection."""
        self.redis_client = redis.from_url(get_redis_url())
        self.window_size_seconds = 60  # 1 minute window
        self.key_prefix = "ratelimit:"

    def _get_rate_key(self, key_id: str) -> str:
        """
        Get the Redis key for a rate limit.

        Args:
            key_id: API key ID or user ID

        Returns:
            Redis key string
        """
        now = datetime.now(UTC)
        # Round down to the start of the current minute
        window_start = now.replace(second=0, microsecond=0)
        window_timestamp = int(window_start.timestamp())
        return f"{self.key_prefix}{key_id}:{window_timestamp}"

    async def check_rate_limit(self, key_id: str, limit: int) -> tuple[bool, int]:
        """
        Check if a request is within rate limit.

        Args:
            key_id: API key ID or user ID
            limit: Maximum requests per minute

        Returns:
            Tuple of (allowed, remaining)
        """
        try:
            rate_key = self._get_rate_key(key_id)
            current_count = self.redis_client.get(rate_key)

            if current_count is None:
                current_count = 0
            else:
                current_count = int(current_count)

            remaining = max(0, limit - current_count)
            allowed = current_count < limit

            return allowed, remaining
        except redis.RedisError as e:
            # SECURITY: Fail-closed on Redis errors to prevent abuse
            # Log warning with details for debugging
            logger.warning(
                f"Redis unavailable for rate limiting (denying request): {e}. "
                "Rate limiting is required for security - please check Redis connection."
            )
            # Return denied with 0 remaining to trigger rate limit response
            return False, 0

    async def increment(self, key_id: str) -> None:
        """
        Increment the request count for an API key.

        Args:
            key_id: API key ID or user ID
        """
        try:
            rate_key = self._get_rate_key(key_id)

            # Use pipeline for atomic increment and expire
            pipe = self.redis_client.pipeline()
            pipe.incr(rate_key)
            pipe.expire(rate_key, self.window_size_seconds + 10)  # Extra buffer
            pipe.execute()
        except redis.RedisError as e:
            logger.error(f"Redis error in increment: {e}")
            # Silently fail - don't break the request flow

    async def get_usage(self, key_id: str) -> dict:
        """
        Get rate limit usage for an API key.

        Args:
            key_id: API key ID or user ID

        Returns:
            Usage statistics
        """
        try:
            rate_key = self._get_rate_key(key_id)
            current_count = self.redis_client.get(rate_key)

            if current_count is None:
                current_count = 0
            else:
                current_count = int(current_count)

            now = datetime.now(UTC)
            window_start = now.replace(second=0, microsecond=0)

            return {
                "key_id": key_id,
                "window_start": window_start.isoformat(),
                "request_count": current_count,
            }
        except redis.RedisError as e:
            logger.error(f"Redis error in get_usage: {e}")
            return {
                "key_id": key_id,
                "window_start": datetime.now(UTC).isoformat(),
                "request_count": 0,
                "error": str(e),
            }

    async def reset(self, key_id: str) -> None:
        """
        Reset rate limit for an API key (delete current window record).

        Args:
            key_id: API key ID or user ID
        """
        try:
            rate_key = self._get_rate_key(key_id)
            self.redis_client.delete(rate_key)
        except redis.RedisError as e:
            logger.error(f"Redis error in reset: {e}")

    async def get_reset_time(self) -> int:
        """
        Get seconds until the current rate limit window resets.

        Returns:
            Seconds until reset
        """
        now = datetime.now(UTC)
        next_window = now.replace(second=0, microsecond=0) + timedelta(minutes=1)
        return int((next_window - now).total_seconds())
