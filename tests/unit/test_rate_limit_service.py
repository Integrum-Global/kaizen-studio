"""
Tier 1: Rate Limit Service Unit Tests

Tests rate limit checking, incrementing, usage tracking, and window calculation.
Mocking is allowed in Tier 1 for external services (Redis).
"""

from unittest.mock import MagicMock, patch

import pytest
from studio.services.rate_limit_service import RateLimitService


@pytest.fixture
def mock_redis():
    """Create a mock Redis client."""
    return MagicMock()


@pytest.fixture
def service_with_mock_redis(mock_redis):
    """Create RateLimitService with mocked Redis."""
    with patch("studio.services.rate_limit_service.redis") as mock_redis_module:
        mock_redis_module.from_url.return_value = mock_redis
        service = RateLimitService()
        return service, mock_redis


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestWindowCalculation:
    """Test rate limit window calculation."""

    def test_rate_key_includes_key_id(self, service_with_mock_redis):
        """Rate key should include the key ID."""
        service, _ = service_with_mock_redis
        rate_key = service._get_rate_key("test_key")
        assert "test_key" in rate_key

    def test_rate_key_has_prefix(self, service_with_mock_redis):
        """Rate key should have the ratelimit prefix."""
        service, _ = service_with_mock_redis
        rate_key = service._get_rate_key("test_key")
        assert rate_key.startswith("ratelimit:")

    def test_window_size_is_60_seconds(self, service_with_mock_redis):
        """Rate limit window should be 60 seconds."""
        service, _ = service_with_mock_redis
        assert service.window_size_seconds == 60


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestRateLimitChecking:
    """Test rate limit checking logic."""

    @pytest.mark.asyncio
    async def test_check_rate_limit_allows_under_limit(self, service_with_mock_redis):
        """Requests under limit should be allowed."""
        service, mock_redis = service_with_mock_redis
        mock_redis.get.return_value = b"5"  # 5 requests made

        allowed, remaining = await service.check_rate_limit("key1", 100)

        assert allowed is True
        assert remaining == 95

    @pytest.mark.asyncio
    async def test_check_rate_limit_denies_at_limit(self, service_with_mock_redis):
        """Requests at limit should be denied."""
        service, mock_redis = service_with_mock_redis
        mock_redis.get.return_value = b"100"  # At limit

        allowed, remaining = await service.check_rate_limit("key1", 100)

        assert allowed is False
        assert remaining == 0

    @pytest.mark.asyncio
    async def test_check_rate_limit_no_prior_requests(self, service_with_mock_redis):
        """No prior requests should allow and show full limit remaining."""
        service, mock_redis = service_with_mock_redis
        mock_redis.get.return_value = None  # No record

        allowed, remaining = await service.check_rate_limit("key1", 100)

        assert allowed is True
        assert remaining == 100

    @pytest.mark.asyncio
    async def test_check_rate_limit_remaining_calculation(
        self, service_with_mock_redis
    ):
        """Remaining should be limit minus count."""
        service, mock_redis = service_with_mock_redis
        mock_redis.get.return_value = b"75"

        allowed, remaining = await service.check_rate_limit("key1", 100)

        assert remaining == 25


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestRateLimitIncrement:
    """Test rate limit incrementing."""

    @pytest.mark.asyncio
    async def test_increment_calls_redis_incr(self, service_with_mock_redis):
        """Increment should call Redis INCR."""
        service, mock_redis = service_with_mock_redis
        mock_pipe = MagicMock()
        mock_redis.pipeline.return_value = mock_pipe

        await service.increment("key1")

        mock_pipe.incr.assert_called_once()

    @pytest.mark.asyncio
    async def test_increment_sets_expiry(self, service_with_mock_redis):
        """Increment should set key expiry."""
        service, mock_redis = service_with_mock_redis
        mock_pipe = MagicMock()
        mock_redis.pipeline.return_value = mock_pipe

        await service.increment("key1")

        mock_pipe.expire.assert_called_once()

    @pytest.mark.asyncio
    async def test_increment_executes_pipeline(self, service_with_mock_redis):
        """Increment should execute the pipeline."""
        service, mock_redis = service_with_mock_redis
        mock_pipe = MagicMock()
        mock_redis.pipeline.return_value = mock_pipe

        await service.increment("key1")

        mock_pipe.execute.assert_called_once()


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestUsageTracking:
    """Test rate limit usage tracking."""

    @pytest.mark.asyncio
    async def test_get_usage_returns_request_count(self, service_with_mock_redis):
        """Get usage should return request count."""
        service, mock_redis = service_with_mock_redis
        mock_redis.get.return_value = b"42"

        usage = await service.get_usage("key1")

        assert usage["request_count"] == 42

    @pytest.mark.asyncio
    async def test_get_usage_zero_if_no_record(self, service_with_mock_redis):
        """Get usage should return 0 if no record exists."""
        service, mock_redis = service_with_mock_redis
        mock_redis.get.return_value = None

        usage = await service.get_usage("key1")

        assert usage["request_count"] == 0

    @pytest.mark.asyncio
    async def test_get_usage_returns_key_id(self, service_with_mock_redis):
        """Get usage should include key_id."""
        service, mock_redis = service_with_mock_redis
        mock_redis.get.return_value = b"10"

        usage = await service.get_usage("test_key")

        assert usage["key_id"] == "test_key"

    @pytest.mark.asyncio
    async def test_get_usage_returns_window_start(self, service_with_mock_redis):
        """Get usage should include window_start."""
        service, mock_redis = service_with_mock_redis
        mock_redis.get.return_value = b"10"

        usage = await service.get_usage("key1")

        assert "window_start" in usage


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestRateLimitReset:
    """Test rate limit reset."""

    @pytest.mark.asyncio
    async def test_reset_deletes_record(self, service_with_mock_redis):
        """Reset should delete the Redis key."""
        service, mock_redis = service_with_mock_redis

        await service.reset("key1")

        mock_redis.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_reset_no_error_if_no_record(self, service_with_mock_redis):
        """Reset should not error if no record exists."""
        service, mock_redis = service_with_mock_redis
        mock_redis.delete.return_value = 0  # Key didn't exist

        # Should not raise
        await service.reset("nonexistent_key")


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestGetResetTime:
    """Test get reset time functionality."""

    @pytest.mark.asyncio
    async def test_get_reset_time_returns_positive(self, service_with_mock_redis):
        """Reset time should be positive."""
        service, _ = service_with_mock_redis

        reset_time = await service.get_reset_time()

        assert reset_time >= 0
        assert reset_time <= 60


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestRateLimitIntegration:
    """Test rate limit service integration patterns."""

    @pytest.mark.asyncio
    async def test_check_then_increment_workflow(self, service_with_mock_redis):
        """Typical workflow: check, then increment on success."""
        service, mock_redis = service_with_mock_redis
        mock_redis.get.return_value = b"50"
        mock_pipe = MagicMock()
        mock_redis.pipeline.return_value = mock_pipe

        # Check first
        allowed, remaining = await service.check_rate_limit("key1", 100)
        assert allowed is True
        assert remaining == 50

        # Then increment
        await service.increment("key1")
        mock_pipe.incr.assert_called_once()

    @pytest.mark.asyncio
    async def test_multiple_keys_separate_limits(self, service_with_mock_redis):
        """Different keys should have separate rate limits."""
        service, mock_redis = service_with_mock_redis

        # Key 1: 50 requests
        mock_redis.get.return_value = b"50"
        allowed1, remaining1 = await service.check_rate_limit("key1", 100)

        # Key 2: 90 requests
        mock_redis.get.return_value = b"90"
        allowed2, remaining2 = await service.check_rate_limit("key2", 100)

        assert allowed1 is True
        assert remaining1 == 50
        assert allowed2 is True
        assert remaining2 == 10


@pytest.mark.unit
@pytest.mark.timeout(1)
class TestRedisErrorHandling:
    """Test Redis error handling."""

    @pytest.mark.asyncio
    async def test_check_rate_limit_redis_error_denies(self, service_with_mock_redis):
        """Redis errors during check should deny (fail-closed)."""
        import redis as redis_module

        service, mock_redis = service_with_mock_redis
        mock_redis.get.side_effect = redis_module.RedisError("Connection failed")

        allowed, remaining = await service.check_rate_limit("key1", 100)

        # SECURITY: Fail-closed on Redis errors
        assert allowed is False
        assert remaining == 0

    @pytest.mark.asyncio
    async def test_increment_redis_error_silent(self, service_with_mock_redis):
        """Redis errors during increment should fail silently."""
        import redis as redis_module

        service, mock_redis = service_with_mock_redis
        mock_redis.pipeline.side_effect = redis_module.RedisError("Connection failed")

        # Should not raise
        await service.increment("key1")

    @pytest.mark.asyncio
    async def test_get_usage_redis_error_returns_zero(self, service_with_mock_redis):
        """Redis errors during get_usage should return zero count with error."""
        import redis as redis_module

        service, mock_redis = service_with_mock_redis
        mock_redis.get.side_effect = redis_module.RedisError("Connection failed")

        usage = await service.get_usage("key1")

        assert usage["request_count"] == 0
        assert "error" in usage
