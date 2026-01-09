"""
Tier 1 Unit Tests: Rate Limiter

Tests ExternalAgentRateLimiter logic without Redis (uses in-memory).
"""

import pytest
import time
from unittest.mock import patch

from studio_kaizen.trust.governance.rate_limiter import ExternalAgentRateLimiter
from studio_kaizen.trust.governance.types import RateLimitConfig


class TestRateLimiterAllowed:
    """Tests for rate limit checks when allowed."""

    @pytest.fixture
    def limiter(self):
        """Create rate limiter with in-memory storage."""
        config = RateLimitConfig(
            requests_per_minute=10,
            requests_per_hour=100,
            requests_per_day=1000
        )
        return ExternalAgentRateLimiter(config=config)

    @pytest.mark.asyncio
    async def test_first_request_allowed(self, limiter):
        """Test that first request is always allowed."""
        result = await limiter.check_rate_limit(
            agent_id="agent-001",
            user_id="user-001"
        )

        assert result.allowed is True
        assert result.limit_exceeded is None
        assert result.remaining == 10  # Full limit available

    @pytest.mark.asyncio
    async def test_multiple_requests_allowed(self, limiter):
        """Test multiple requests within limit."""
        # Make 5 requests
        for i in range(5):
            await limiter.record_invocation(
                agent_id="agent-001",
                user_id="user-001"
            )

        result = await limiter.check_rate_limit(
            agent_id="agent-001",
            user_id="user-001"
        )

        assert result.allowed is True
        assert result.remaining == 5  # 10 - 5 = 5

    @pytest.mark.asyncio
    async def test_different_agents_isolated(self, limiter):
        """Test that different agents have separate limits."""
        # Max out agent-001
        for i in range(10):
            await limiter.record_invocation(
                agent_id="agent-001",
                user_id="user-001"
            )

        # Check agent-002 (should have full limit)
        result = await limiter.check_rate_limit(
            agent_id="agent-002",
            user_id="user-001"
        )

        assert result.allowed is True
        assert result.remaining == 10

    @pytest.mark.asyncio
    async def test_different_users_isolated(self, limiter):
        """Test that different users have separate limits."""
        # Max out user-001
        for i in range(10):
            await limiter.record_invocation(
                agent_id="agent-001",
                user_id="user-001"
            )

        # Check user-002 (should have full limit)
        result = await limiter.check_rate_limit(
            agent_id="agent-001",
            user_id="user-002"
        )

        assert result.allowed is True
        assert result.remaining == 10


class TestRateLimiterExceeded:
    """Tests for rate limit exceeded scenarios."""

    @pytest.fixture
    def limiter(self):
        """Create rate limiter with low limits for testing."""
        config = RateLimitConfig(
            requests_per_minute=5,
            requests_per_hour=50,
            requests_per_day=500
        )
        return ExternalAgentRateLimiter(config=config)

    @pytest.mark.asyncio
    async def test_minute_limit_exceeded(self, limiter):
        """Test minute limit exceeded."""
        # Exhaust minute limit
        for i in range(5):
            await limiter.record_invocation(
                agent_id="agent-001",
                user_id="user-001"
            )

        result = await limiter.check_rate_limit(
            agent_id="agent-001",
            user_id="user-001"
        )

        assert result.allowed is False
        assert result.limit_exceeded == "requests_per_minute"
        assert result.remaining == 0
        assert result.retry_after_seconds is not None

    @pytest.mark.asyncio
    async def test_retry_after_provided(self, limiter):
        """Test that retry_after_seconds is provided when exceeded."""
        # Exhaust limit
        for i in range(5):
            await limiter.record_invocation(
                agent_id="agent-001",
                user_id="user-001"
            )

        result = await limiter.check_rate_limit(
            agent_id="agent-001",
            user_id="user-001"
        )

        assert result.retry_after_seconds is not None
        assert result.retry_after_seconds > 0
        assert result.retry_after_seconds <= 60  # At most 60 seconds

    @pytest.mark.asyncio
    async def test_current_usage_reported(self, limiter):
        """Test that current usage is reported."""
        # Make some requests
        for i in range(3):
            await limiter.record_invocation(
                agent_id="agent-001",
                user_id="user-001"
            )

        result = await limiter.check_rate_limit(
            agent_id="agent-001",
            user_id="user-001"
        )

        assert "minute" in result.current_usage
        assert result.current_usage["minute"] == 3


class TestRateLimiterWindowExpiry:
    """Tests for rate limit window expiration."""

    @pytest.fixture
    def limiter(self):
        """Create rate limiter."""
        config = RateLimitConfig(requests_per_minute=5)
        return ExternalAgentRateLimiter(config=config)

    @pytest.mark.asyncio
    async def test_window_expires_and_resets(self, limiter):
        """Test that rate limit resets after window expires."""
        # Record initial invocations at time 0
        with patch.object(time, 'time', return_value=1000.0):
            for i in range(5):
                await limiter.record_invocation(
                    agent_id="agent-001",
                    user_id="user-001"
                )

        # Check at time 0 - should be exceeded
        with patch.object(time, 'time', return_value=1000.0):
            result = await limiter.check_rate_limit(
                agent_id="agent-001",
                user_id="user-001"
            )
            assert result.allowed is False

        # Check at time 61 (after minute window) - should be allowed
        with patch.object(time, 'time', return_value=1061.0):
            result = await limiter.check_rate_limit(
                agent_id="agent-001",
                user_id="user-001"
            )
            assert result.allowed is True
            assert result.remaining == 5


class TestRateLimiterKeyGeneration:
    """Tests for rate limit key generation."""

    def test_key_generation_minimal(self):
        """Test key generation with minimal info."""
        limiter = ExternalAgentRateLimiter()
        key = limiter._get_key(agent_id="agent-001", user_id="user-001")

        assert "agent-001" in key
        assert "user-001" in key

    def test_key_generation_full(self):
        """Test key generation with all fields."""
        limiter = ExternalAgentRateLimiter()
        key = limiter._get_key(
            agent_id="agent-001",
            user_id="user-001",
            team_id="team-001",
            org_id="org-001"
        )

        assert "agent-001" in key
        assert "user-001" in key
        assert "team-001" in key
        assert "org-001" in key

    def test_different_keys_for_different_inputs(self):
        """Test that different inputs produce different keys."""
        limiter = ExternalAgentRateLimiter()

        key1 = limiter._get_key(agent_id="agent-001", user_id="user-001")
        key2 = limiter._get_key(agent_id="agent-001", user_id="user-002")
        key3 = limiter._get_key(agent_id="agent-002", user_id="user-001")

        assert key1 != key2
        assert key1 != key3
        assert key2 != key3


class TestRateLimiterInitialization:
    """Tests for rate limiter initialization."""

    @pytest.mark.asyncio
    async def test_initialize_without_redis(self):
        """Test initialization without Redis (in-memory mode)."""
        limiter = ExternalAgentRateLimiter()
        await limiter.initialize()

        # Should work in-memory
        result = await limiter.check_rate_limit(
            agent_id="agent-001",
            user_id="user-001"
        )
        assert result.allowed is True

    @pytest.mark.asyncio
    async def test_close_clears_data(self):
        """Test that close clears in-memory data."""
        limiter = ExternalAgentRateLimiter(
            config=RateLimitConfig(requests_per_minute=5)
        )

        # Record some invocations
        for i in range(3):
            await limiter.record_invocation(
                agent_id="agent-001",
                user_id="user-001"
            )

        # Close and check data is cleared
        await limiter.close()

        # After close, should have full limit again
        result = await limiter.check_rate_limit(
            agent_id="agent-001",
            user_id="user-001"
        )
        assert result.remaining == 5
