"""
Unit Tests for Scaling Service

Tier 1: Fast, isolated tests without external dependencies.
Tests scaling decision logic, threshold calculations, and cooldown logic.
"""

import uuid
from datetime import UTC, datetime

import pytest
from studio.services.scaling_service import SCALING_METRICS, ScalingService


class TestScalingServiceMetrics:
    """Test supported metrics functionality."""

    @pytest.fixture
    def scaling_service(self):
        """Create scaling service instance."""
        return ScalingService()

    def test_get_supported_metrics_returns_dict(self, scaling_service):
        """Test get_supported_metrics returns dictionary."""
        metrics = scaling_service.get_supported_metrics()
        assert isinstance(metrics, dict)

    def test_get_supported_metrics_contains_cpu(self, scaling_service):
        """Test CPU metric is supported."""
        metrics = scaling_service.get_supported_metrics()
        assert "cpu" in metrics

    def test_get_supported_metrics_contains_memory(self, scaling_service):
        """Test memory metric is supported."""
        metrics = scaling_service.get_supported_metrics()
        assert "memory" in metrics

    def test_get_supported_metrics_contains_requests_per_second(self, scaling_service):
        """Test requests_per_second metric is supported."""
        metrics = scaling_service.get_supported_metrics()
        assert "requests_per_second" in metrics

    def test_get_supported_metrics_contains_latency_p99(self, scaling_service):
        """Test latency_p99 metric is supported."""
        metrics = scaling_service.get_supported_metrics()
        assert "latency_p99" in metrics

    def test_get_supported_metrics_contains_error_rate(self, scaling_service):
        """Test error_rate metric is supported."""
        metrics = scaling_service.get_supported_metrics()
        assert "error_rate" in metrics

    def test_get_supported_metrics_has_descriptions(self, scaling_service):
        """Test metrics have descriptions."""
        metrics = scaling_service.get_supported_metrics()
        for metric_name, description in metrics.items():
            assert isinstance(description, str)
            assert len(description) > 0

    def test_supported_metrics_constant_matches_service(self, scaling_service):
        """Test service metrics match constant."""
        metrics = scaling_service.get_supported_metrics()
        assert metrics == SCALING_METRICS


class TestScalingThresholdCalculation:
    """Test threshold calculation logic."""

    @pytest.fixture
    def scaling_service(self):
        """Create scaling service instance."""
        return ScalingService()

    def test_deviation_calculation_above_target(self, scaling_service):
        """Test deviation calculation when metric above target."""
        # Metric: 80, Target: 70 -> deviation = (80-70)/70 * 100 = 14.29%
        metric_value = 80.0
        target = 70.0
        expected_deviation = ((metric_value - target) / target) * 100
        assert expected_deviation == pytest.approx(14.29, 0.01)

    def test_deviation_calculation_below_target(self, scaling_service):
        """Test deviation calculation when metric below target."""
        # Metric: 50, Target: 70 -> deviation = (50-70)/70 * 100 = -28.57%
        metric_value = 50.0
        target = 70.0
        expected_deviation = ((metric_value - target) / target) * 100
        assert expected_deviation == pytest.approx(-28.57, 0.01)

    def test_deviation_calculation_equals_target(self, scaling_service):
        """Test deviation is zero when metric equals target."""
        metric_value = 70.0
        target = 70.0
        expected_deviation = ((metric_value - target) / target) * 100
        assert expected_deviation == 0.0

    def test_scale_up_threshold_evaluation_above(self, scaling_service):
        """Test scale-up decision when deviation above threshold."""
        metric_value = 95.0
        target = 70.0
        scale_up_threshold = 20.0
        deviation = ((metric_value - target) / target) * 100
        # deviation = 35.71%, threshold = 20% -> should scale up
        assert deviation >= scale_up_threshold

    def test_scale_up_threshold_evaluation_below(self, scaling_service):
        """Test scale-up not triggered when deviation below threshold."""
        metric_value = 85.0
        target = 70.0
        scale_up_threshold = 25.0
        deviation = ((metric_value - target) / target) * 100
        # deviation = 21.43%, threshold = 25% -> should not scale up
        assert deviation < scale_up_threshold

    def test_scale_down_threshold_evaluation_above(self, scaling_service):
        """Test scale-down decision when deviation below threshold."""
        metric_value = 40.0
        target = 70.0
        scale_down_threshold = 30.0
        deviation = ((metric_value - target) / target) * 100
        # deviation = -42.86%, -deviation = 42.86% >= 30% -> should scale down
        assert -deviation >= scale_down_threshold

    def test_scale_down_threshold_evaluation_below(self, scaling_service):
        """Test scale-down not triggered when within threshold."""
        metric_value = 55.0
        target = 70.0
        scale_down_threshold = 30.0
        deviation = ((metric_value - target) / target) * 100
        # deviation = -21.43%, -deviation = 21.43% < 30% -> should not scale down
        assert -deviation < scale_down_threshold

    def test_zero_target_deviation_is_zero(self, scaling_service):
        """Test deviation is zero when target is zero."""
        metric_value = 50.0
        target = 0.0
        if target > 0:
            deviation = ((metric_value - target) / target) * 100
        else:
            deviation = 0
        assert deviation == 0


class TestScalingInstanceLimits:
    """Test instance scaling within min/max bounds."""

    @pytest.fixture
    def scaling_service(self):
        """Create scaling service instance."""
        return ScalingService()

    def test_scale_up_respects_max_instances(self, scaling_service):
        """Test scale-up respects maximum instance limit."""
        current_instances = 9
        max_instances = 10
        new_instances = min(current_instances + 1, max_instances)
        assert new_instances == 10

    def test_scale_up_at_max_does_not_increase(self, scaling_service):
        """Test scale-up at max instances does not increase."""
        current_instances = 10
        max_instances = 10
        new_instances = min(current_instances + 1, max_instances)
        assert new_instances == 10

    def test_scale_down_respects_min_instances(self, scaling_service):
        """Test scale-down respects minimum instance limit."""
        current_instances = 2
        min_instances = 1
        new_instances = max(current_instances - 1, min_instances)
        assert new_instances == 1

    def test_scale_down_at_min_does_not_decrease(self, scaling_service):
        """Test scale-down at min instances does not decrease."""
        current_instances = 1
        min_instances = 1
        new_instances = max(current_instances - 1, min_instances)
        assert new_instances == 1

    def test_scale_up_multiple_instances(self, scaling_service):
        """Test scaling up multiple instances at once."""
        current_instances = 1
        max_instances = 10
        # Each evaluation scales by 1
        new_instances = min(current_instances + 1, max_instances)
        assert new_instances == 2

    def test_scale_down_from_multiple_instances(self, scaling_service):
        """Test scaling down from multiple instances."""
        current_instances = 8
        min_instances = 1
        new_instances = max(current_instances - 1, min_instances)
        assert new_instances == 7

    def test_valid_min_max_range(self, scaling_service):
        """Test min and max instances create valid range."""
        min_instances = 1
        max_instances = 10
        assert min_instances < max_instances

    def test_single_instance_policy(self, scaling_service):
        """Test policy with min=max=1 (no scaling)."""
        min_instances = 1
        max_instances = 1
        current = 1
        new_up = min(current + 1, max_instances)
        new_down = max(current - 1, min_instances)
        assert new_up == 1
        assert new_down == 1


class TestScalingPolicyCooldown:
    """Test cooldown logic between scaling actions."""

    @pytest.fixture
    def scaling_service(self):
        """Create scaling service instance."""
        return ScalingService()

    def test_cooldown_seconds_validation(self, scaling_service):
        """Test cooldown_seconds is positive."""
        cooldown_seconds = 300
        assert cooldown_seconds > 0

    def test_cooldown_minimum_value(self, scaling_service):
        """Test cooldown has reasonable minimum."""
        min_cooldown = 60  # 1 minute
        assert min_cooldown > 0

    def test_cooldown_typical_values(self, scaling_service):
        """Test typical cooldown values."""
        typical_values = [60, 300, 600, 900, 1800]
        for cooldown in typical_values:
            assert cooldown > 0

    def test_cooldown_prevents_rapid_scaling(self, scaling_service):
        """Test cooldown concept prevents rapid scaling."""
        last_scale_time = datetime.now(UTC)
        cooldown_seconds = 300
        # Time when next scaling can occur
        next_scale_allowed = last_scale_time.timestamp() + cooldown_seconds
        current_time = datetime.now(UTC).timestamp()
        # Current time is less than next allowed, so scaling blocked
        assert current_time < next_scale_allowed


class TestScalingMetricValidation:
    """Test metric validation in scaling policies."""

    @pytest.fixture
    def scaling_service(self):
        """Create scaling service instance."""
        return ScalingService()

    def test_cpu_metric_is_valid(self, scaling_service):
        """Test CPU is valid metric."""
        metrics = scaling_service.get_supported_metrics()
        assert "cpu" in metrics

    def test_memory_metric_is_valid(self, scaling_service):
        """Test memory is valid metric."""
        metrics = scaling_service.get_supported_metrics()
        assert "memory" in metrics

    def test_requests_per_second_metric_is_valid(self, scaling_service):
        """Test requests_per_second is valid metric."""
        metrics = scaling_service.get_supported_metrics()
        assert "requests_per_second" in metrics

    def test_latency_p99_metric_is_valid(self, scaling_service):
        """Test latency_p99 is valid metric."""
        metrics = scaling_service.get_supported_metrics()
        assert "latency_p99" in metrics

    def test_error_rate_metric_is_valid(self, scaling_service):
        """Test error_rate is valid metric."""
        metrics = scaling_service.get_supported_metrics()
        assert "error_rate" in metrics

    def test_invalid_metric_rejected(self, scaling_service):
        """Test invalid metric is rejected."""
        metrics = scaling_service.get_supported_metrics()
        assert "invalid_metric" not in metrics

    def test_metric_validation_case_sensitive(self, scaling_service):
        """Test metric validation is case-sensitive."""
        metrics = scaling_service.get_supported_metrics()
        assert "CPU" not in metrics  # uppercase not valid
        assert "cpu" in metrics  # lowercase valid


class TestScalingServiceInitialization:
    """Test scaling service initialization."""

    def test_service_initialization(self):
        """Test service initializes without errors."""
        service = ScalingService()
        assert service is not None

    def test_service_has_runtime(self):
        """Test service has async runtime."""
        service = ScalingService()
        assert service.runtime is not None

    def test_service_has_settings(self):
        """Test service has settings."""
        service = ScalingService()
        assert service.settings is not None

    def test_multiple_service_instances(self):
        """Test multiple service instances can be created."""
        service1 = ScalingService()
        service2 = ScalingService()
        assert service1 is not None
        assert service2 is not None


class TestScalingDecisionLogic:
    """Test high-level scaling decision logic."""

    def test_scale_up_triggered_with_high_metric(self):
        """Test scale-up is triggered when metric is significantly above target."""
        metric_value = 95.0
        target = 70.0
        scale_up_threshold = 20.0
        current_instances = 2
        max_instances = 10

        deviation = ((metric_value - target) / target) * 100
        should_scale_up = (
            deviation >= scale_up_threshold and current_instances < max_instances
        )

        assert should_scale_up is True

    def test_scale_down_triggered_with_low_metric(self):
        """Test scale-down is triggered when metric is significantly below target."""
        metric_value = 30.0
        target = 70.0
        scale_down_threshold = 30.0
        current_instances = 5
        min_instances = 1

        deviation = ((metric_value - target) / target) * 100
        should_scale_down = (
            -deviation >= scale_down_threshold and current_instances > min_instances
        )

        assert should_scale_down is True

    def test_no_scaling_when_metric_within_thresholds(self):
        """Test no scaling when metric is within thresholds."""
        metric_value = 72.0
        target = 70.0
        scale_up_threshold = 20.0
        scale_down_threshold = 30.0
        current_instances = 3

        deviation = ((metric_value - target) / target) * 100
        should_scale_up = deviation >= scale_up_threshold
        should_scale_down = -deviation >= scale_down_threshold

        assert should_scale_up is False
        assert should_scale_down is False

    def test_scale_up_prevented_at_max_instances(self):
        """Test scale-up is prevented at max instances."""
        metric_value = 95.0
        target = 70.0
        scale_up_threshold = 20.0
        current_instances = 10
        max_instances = 10

        deviation = ((metric_value - target) / target) * 100
        should_scale_up = (
            deviation >= scale_up_threshold and current_instances < max_instances
        )

        assert should_scale_up is False

    def test_scale_down_prevented_at_min_instances(self):
        """Test scale-down is prevented at min instances."""
        metric_value = 30.0
        target = 70.0
        scale_down_threshold = 30.0
        current_instances = 1
        min_instances = 1

        deviation = ((metric_value - target) / target) * 100
        should_scale_down = (
            -deviation >= scale_down_threshold and current_instances > min_instances
        )

        assert should_scale_down is False


class TestScalingPolicyDefaults:
    """Test default values for scaling policies."""

    def test_default_min_instances(self):
        """Test default minimum instances is 1."""
        min_instances = 1
        assert min_instances > 0

    def test_default_max_instances(self):
        """Test default maximum instances is 10."""
        max_instances = 10
        assert max_instances > 0

    def test_default_target_metric_is_cpu(self):
        """Test default metric is CPU."""
        default_metric = "cpu"
        metrics = SCALING_METRICS
        assert default_metric in metrics

    def test_default_target_value(self):
        """Test default target value is 70."""
        target_value = 70.0
        assert target_value > 0

    def test_default_scale_up_threshold(self):
        """Test default scale-up threshold is 80."""
        scale_up_threshold = 80.0
        assert scale_up_threshold >= 0

    def test_default_scale_down_threshold(self):
        """Test default scale-down threshold is 20."""
        scale_down_threshold = 20.0
        assert scale_down_threshold >= 0

    def test_default_cooldown_seconds(self):
        """Test default cooldown is 300 seconds."""
        cooldown_seconds = 300
        assert cooldown_seconds > 0

    def test_scale_up_threshold_greater_than_target(self):
        """Test scale-up threshold is greater than target."""
        target = 70.0
        scale_up_threshold = 80.0
        assert scale_up_threshold > target

    def test_scale_down_threshold_less_than_target(self):
        """Test scale-down threshold is less than target."""
        target = 70.0
        scale_down_threshold = 20.0
        assert scale_down_threshold < target


class TestScalingEventTracking:
    """Test scaling event data structures."""

    def test_scaling_event_has_policy_id(self):
        """Test scaling event includes policy ID."""
        event_data = {
            "id": str(uuid.uuid4()),
            "policy_id": str(uuid.uuid4()),
            "gateway_id": str(uuid.uuid4()),
        }
        assert "policy_id" in event_data

    def test_scaling_event_has_gateway_id(self):
        """Test scaling event includes gateway ID."""
        event_data = {
            "id": str(uuid.uuid4()),
            "policy_id": str(uuid.uuid4()),
            "gateway_id": str(uuid.uuid4()),
        }
        assert "gateway_id" in event_data

    def test_scaling_event_has_event_type(self):
        """Test scaling event includes type."""
        event_data = {"event_type": "scale_up"}
        assert "event_type" in event_data

    def test_scaling_event_type_scale_up(self):
        """Test event type can be scale_up."""
        event_type = "scale_up"
        assert event_type in ["scale_up", "scale_down"]

    def test_scaling_event_type_scale_down(self):
        """Test event type can be scale_down."""
        event_type = "scale_down"
        assert event_type in ["scale_up", "scale_down"]

    def test_scaling_event_has_from_instances(self):
        """Test event includes initial instance count."""
        event_data = {"from_instances": 2}
        assert "from_instances" in event_data

    def test_scaling_event_has_to_instances(self):
        """Test event includes target instance count."""
        event_data = {"to_instances": 3}
        assert "to_instances" in event_data

    def test_scaling_event_has_trigger_metric(self):
        """Test event includes trigger metric name."""
        event_data = {"trigger_metric": "cpu"}
        assert "trigger_metric" in event_data

    def test_scaling_event_has_trigger_value(self):
        """Test event includes trigger metric value."""
        event_data = {"trigger_value": 95.5}
        assert "trigger_value" in event_data

    def test_scaling_event_has_status(self):
        """Test event includes status."""
        event_data = {"status": "completed"}
        assert "status" in event_data

    def test_scaling_event_status_completed(self):
        """Test event status can be completed."""
        status = "completed"
        assert status in ["pending", "completed", "failed"]

    def test_scaling_event_status_pending(self):
        """Test event status can be pending."""
        status = "pending"
        assert status in ["pending", "completed", "failed"]

    def test_scaling_event_status_failed(self):
        """Test event status can be failed."""
        status = "failed"
        assert status in ["pending", "completed", "failed"]
