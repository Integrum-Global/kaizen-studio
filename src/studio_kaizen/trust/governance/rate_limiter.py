"""
External Agent Rate Limiter

Production-ready rate limiting for external agent invocations.
Supports Redis-backed distributed rate limiting with fallback
to in-memory for testing.
"""

import logging
import time
from collections import defaultdict
from typing import Any

from studio_kaizen.trust.governance.types import RateLimitCheckResult, RateLimitConfig

logger = logging.getLogger(__name__)


class ExternalAgentRateLimiter:
    """
    Rate limiter for external agent invocations.

    Supports multiple rate limit windows (per-minute, per-hour, per-day)
    with Redis backend for distributed systems or in-memory for testing.

    Examples:
        >>> # With Redis (production)
        >>> limiter = ExternalAgentRateLimiter(
        ...     redis_url="redis://localhost:6379/0",
        ...     config=RateLimitConfig(requests_per_minute=60)
        ... )
        >>> await limiter.initialize()
        >>>
        >>> # Check rate limit
        >>> result = await limiter.check_rate_limit(
        ...     agent_id="agent-001",
        ...     user_id="user-001"
        ... )
        >>> if result.allowed:
        ...     await execute_request()
        ...     await limiter.record_invocation(agent_id="agent-001", user_id="user-001")

        >>> # In-memory (testing)
        >>> limiter = ExternalAgentRateLimiter()  # No redis_url = in-memory
    """

    def __init__(
        self,
        redis_url: str | None = None,
        config: RateLimitConfig | None = None,
    ):
        """
        Initialize rate limiter.

        Args:
            redis_url: Redis connection URL (optional, uses in-memory if not provided)
            config: Rate limit configuration
        """
        self.redis_url = redis_url
        self.config = config or RateLimitConfig()
        self._redis: Any = None
        self._initialized = False

        # In-memory storage (used when Redis not available)
        self._invocations: dict[str, list[float]] = defaultdict(list)

    async def initialize(self) -> None:
        """
        Initialize Redis connection if configured.

        Falls back to in-memory if Redis unavailable.
        """
        if self.redis_url:
            try:
                import redis.asyncio as redis

                self._redis = redis.from_url(self.redis_url)
                await self._redis.ping()
                self._initialized = True
                logger.info(f"Rate limiter initialized with Redis: {self.redis_url}")
            except Exception as e:
                logger.warning(
                    f"Failed to connect to Redis: {e}. "
                    "Using in-memory rate limiting."
                )
                self._redis = None
                self._initialized = True
        else:
            self._initialized = True
            logger.info("Rate limiter initialized with in-memory storage")

    async def close(self) -> None:
        """Close Redis connection and clear in-memory data."""
        if self._redis:
            await self._redis.close()
            self._redis = None
        self._invocations.clear()
        self._initialized = False

    def _get_key(self, **kwargs) -> str:
        """
        Generate rate limit key from kwargs.

        Key format: agent_id:user_id:team_id:org_id
        """
        agent_id = kwargs.get("agent_id", "")
        user_id = kwargs.get("user_id", "")
        team_id = kwargs.get("team_id", "")
        org_id = kwargs.get("org_id", "")
        return f"ratelimit:{agent_id}:{user_id}:{team_id}:{org_id}"

    async def check_rate_limit(self, **kwargs) -> RateLimitCheckResult:
        """
        Check if request is within rate limits.

        Checks against per-minute, per-hour, and per-day limits.

        Args:
            agent_id: External agent ID
            user_id: User ID
            team_id: Optional team ID
            org_id: Optional organization ID

        Returns:
            RateLimitCheckResult with allowed status and retry info

        Examples:
            >>> result = await limiter.check_rate_limit(
            ...     agent_id="agent-001",
            ...     user_id="user-001"
            ... )
            >>> if not result.allowed:
            ...     raise HTTPException(
            ...         429,
            ...         headers={"Retry-After": str(result.retry_after_seconds)}
            ...     )
        """
        if self._redis:
            return await self._check_redis_rate_limit(**kwargs)
        return await self._check_memory_rate_limit(**kwargs)

    async def _check_memory_rate_limit(self, **kwargs) -> RateLimitCheckResult:
        """Check rate limit using in-memory storage."""
        key = self._get_key(**kwargs)
        now = time.time()

        # Clean old invocations and count for each window
        minute_count = self._clean_and_count(key, 60, now)
        hour_count = self._clean_and_count(key, 3600, now)
        day_count = self._clean_and_count(key, 86400, now)

        current_usage = {
            "minute": minute_count,
            "hour": hour_count,
            "day": day_count,
        }

        # Check minute limit
        if minute_count >= self.config.requests_per_minute:
            return RateLimitCheckResult(
                allowed=False,
                limit_exceeded="requests_per_minute",
                remaining=0,
                retry_after_seconds=60 - int(now % 60),
                current_usage=current_usage,
            )

        # Check hour limit
        if hour_count >= self.config.requests_per_hour:
            return RateLimitCheckResult(
                allowed=False,
                limit_exceeded="requests_per_hour",
                remaining=0,
                retry_after_seconds=3600 - int(now % 3600),
                current_usage=current_usage,
            )

        # Check day limit
        if day_count >= self.config.requests_per_day:
            return RateLimitCheckResult(
                allowed=False,
                limit_exceeded="requests_per_day",
                remaining=0,
                retry_after_seconds=86400 - int(now % 86400),
                current_usage=current_usage,
            )

        # All limits OK
        remaining = min(
            self.config.requests_per_minute - minute_count,
            self.config.requests_per_hour - hour_count,
            self.config.requests_per_day - day_count,
        )

        return RateLimitCheckResult(
            allowed=True,
            limit_exceeded=None,
            remaining=remaining,
            retry_after_seconds=None,
            current_usage=current_usage,
        )

    def _clean_and_count(self, key: str, window_seconds: int, now: float) -> int:
        """Clean old invocations outside window and return count."""
        cutoff = now - window_seconds
        self._invocations[key] = [
            t for t in self._invocations[key] if t > cutoff
        ]
        return len(self._invocations[key])

    async def _check_redis_rate_limit(self, **kwargs) -> RateLimitCheckResult:
        """Check rate limit using Redis backend."""
        key = self._get_key(**kwargs)
        now = time.time()

        # Use Redis ZRANGEBYSCORE to count invocations in each window
        try:
            pipe = self._redis.pipeline()

            # Count for each window
            minute_key = f"{key}:minute"
            hour_key = f"{key}:hour"
            day_key = f"{key}:day"

            minute_cutoff = now - 60
            hour_cutoff = now - 3600
            day_cutoff = now - 86400

            pipe.zcount(minute_key, minute_cutoff, now)
            pipe.zcount(hour_key, hour_cutoff, now)
            pipe.zcount(day_key, day_cutoff, now)

            results = await pipe.execute()
            minute_count, hour_count, day_count = results

            current_usage = {
                "minute": minute_count,
                "hour": hour_count,
                "day": day_count,
            }

            # Check limits
            if minute_count >= self.config.requests_per_minute:
                return RateLimitCheckResult(
                    allowed=False,
                    limit_exceeded="requests_per_minute",
                    remaining=0,
                    retry_after_seconds=60,
                    current_usage=current_usage,
                )

            if hour_count >= self.config.requests_per_hour:
                return RateLimitCheckResult(
                    allowed=False,
                    limit_exceeded="requests_per_hour",
                    remaining=0,
                    retry_after_seconds=3600,
                    current_usage=current_usage,
                )

            if day_count >= self.config.requests_per_day:
                return RateLimitCheckResult(
                    allowed=False,
                    limit_exceeded="requests_per_day",
                    remaining=0,
                    retry_after_seconds=86400,
                    current_usage=current_usage,
                )

            remaining = min(
                self.config.requests_per_minute - minute_count,
                self.config.requests_per_hour - hour_count,
                self.config.requests_per_day - day_count,
            )

            return RateLimitCheckResult(
                allowed=True,
                limit_exceeded=None,
                remaining=remaining,
                retry_after_seconds=None,
                current_usage=current_usage,
            )

        except Exception as e:
            logger.error(f"Redis rate limit check failed: {e}")
            # Fail open on Redis errors (allow request)
            return RateLimitCheckResult(
                allowed=True,
                limit_exceeded=None,
                remaining=-1,
                retry_after_seconds=None,
                current_usage={},
            )

    async def record_invocation(self, **kwargs) -> None:
        """
        Record an invocation for rate limiting.

        Should be called AFTER successful request completion.

        Args:
            agent_id: External agent ID
            user_id: User ID
            team_id: Optional team ID
            org_id: Optional organization ID
        """
        if self._redis:
            await self._record_redis_invocation(**kwargs)
        else:
            await self._record_memory_invocation(**kwargs)

    async def _record_memory_invocation(self, **kwargs) -> None:
        """Record invocation in memory."""
        key = self._get_key(**kwargs)
        now = time.time()
        self._invocations[key].append(now)

    async def _record_redis_invocation(self, **kwargs) -> None:
        """Record invocation in Redis."""
        key = self._get_key(**kwargs)
        now = time.time()

        try:
            pipe = self._redis.pipeline()

            # Add to all window sorted sets
            minute_key = f"{key}:minute"
            hour_key = f"{key}:hour"
            day_key = f"{key}:day"

            # ZADD with timestamp as score
            pipe.zadd(minute_key, {str(now): now})
            pipe.zadd(hour_key, {str(now): now})
            pipe.zadd(day_key, {str(now): now})

            # Set expiry to clean up old keys
            pipe.expire(minute_key, 120)  # 2 minutes
            pipe.expire(hour_key, 7200)  # 2 hours
            pipe.expire(day_key, 172800)  # 2 days

            # Clean old entries
            minute_cutoff = now - 60
            hour_cutoff = now - 3600
            day_cutoff = now - 86400

            pipe.zremrangebyscore(minute_key, 0, minute_cutoff)
            pipe.zremrangebyscore(hour_key, 0, hour_cutoff)
            pipe.zremrangebyscore(day_key, 0, day_cutoff)

            await pipe.execute()

        except Exception as e:
            logger.error(f"Failed to record invocation in Redis: {e}")
            # Don't fail the request if recording fails


__all__ = [
    "ExternalAgentRateLimiter",
]
