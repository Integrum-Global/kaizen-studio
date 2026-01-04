"""
Tier 1 Unit Tests: Budget Configuration

Tests configuration classes without any infrastructure.
"""

import pytest
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from kaizen.trust.governance.config import (
    ExternalAgentBudgetConfig,
    BudgetAlertConfig,
)


class TestExternalAgentBudgetConfig:
    """Tests for ExternalAgentBudgetConfig dataclass."""

    def test_default_config(self):
        """Test default configuration values."""
        config = ExternalAgentBudgetConfig()
        assert config.max_tokens_per_period is None
        assert config.max_cost_per_period is None
        assert config.period == "monthly"
        assert config.warning_threshold == 0.75
        assert config.degradation_threshold == 0.90
        assert config.enforcement_mode == "hard"

    def test_custom_config(self):
        """Test custom configuration values."""
        config = ExternalAgentBudgetConfig(
            max_cost_per_period=500.0,
            max_invocations_per_period=10000,
            period="daily",
            warning_threshold=0.80
        )
        assert config.max_cost_per_period == 500.0
        assert config.max_invocations_per_period == 10000
        assert config.period == "daily"
        assert config.warning_threshold == 0.80

    def test_cost_rates(self):
        """Test cost rate configuration."""
        config = ExternalAgentBudgetConfig(
            input_token_rate=0.00002,
            output_token_rate=0.00006,
            base_invocation_cost=0.01
        )
        assert config.input_token_rate == 0.00002
        assert config.output_token_rate == 0.00006
        assert config.base_invocation_cost == 0.01

    def test_calculate_cost(self):
        """Test cost calculation."""
        config = ExternalAgentBudgetConfig(
            input_token_rate=0.00001,  # $0.01 per 1000 tokens
            output_token_rate=0.00003,  # $0.03 per 1000 tokens
            base_invocation_cost=0.001
        )
        cost = config.calculate_cost(
            input_tokens=1000,
            output_tokens=500,
            invocations=1
        )
        # 1000 * 0.00001 + 500 * 0.00003 + 1 * 0.001 = 0.01 + 0.015 + 0.001 = 0.026
        assert cost == pytest.approx(0.026, rel=1e-6)

    def test_calculate_cost_multiple_invocations(self):
        """Test cost calculation with multiple invocations."""
        config = ExternalAgentBudgetConfig(
            input_token_rate=0.00001,
            output_token_rate=0.00003,
            base_invocation_cost=0.01
        )
        cost = config.calculate_cost(
            input_tokens=5000,
            output_tokens=2000,
            invocations=10
        )
        # 5000 * 0.00001 + 2000 * 0.00003 + 10 * 0.01 = 0.05 + 0.06 + 0.10 = 0.21
        assert cost == pytest.approx(0.21, rel=1e-6)

    def test_warning_threshold_check(self):
        """Test warning threshold detection."""
        config = ExternalAgentBudgetConfig(warning_threshold=0.75)
        assert config.is_warning_threshold_reached(0.74) is False
        assert config.is_warning_threshold_reached(0.75) is True
        assert config.is_warning_threshold_reached(0.80) is True

    def test_degradation_threshold_check(self):
        """Test degradation threshold detection."""
        config = ExternalAgentBudgetConfig(degradation_threshold=0.90)
        assert config.is_degradation_threshold_reached(0.89) is False
        assert config.is_degradation_threshold_reached(0.90) is True
        assert config.is_degradation_threshold_reached(0.95) is True

    def test_alert_thresholds(self):
        """Test alert threshold configuration."""
        config = ExternalAgentBudgetConfig(
            alert_thresholds=[0.25, 0.50, 0.75, 0.90, 1.00]
        )
        assert len(config.alert_thresholds) == 5
        assert 0.50 in config.alert_thresholds

    def test_get_triggered_alerts(self):
        """Test getting triggered alerts at various usage levels."""
        config = ExternalAgentBudgetConfig(
            alert_thresholds=[0.50, 0.75, 0.90, 1.00]
        )

        # At 40%, no alerts triggered
        alerts_40 = config.get_triggered_alerts(0.40)
        assert len(alerts_40) == 0

        # At 60%, 50% alert triggered
        alerts_60 = config.get_triggered_alerts(0.60)
        assert len(alerts_60) == 1
        assert 0.50 in alerts_60

        # At 80%, 50% and 75% alerts triggered
        alerts_80 = config.get_triggered_alerts(0.80)
        assert len(alerts_80) == 2
        assert 0.50 in alerts_80
        assert 0.75 in alerts_80

    def test_period_boundaries_monthly(self):
        """Test monthly period boundary calculation."""
        config = ExternalAgentBudgetConfig(period="monthly", timezone="UTC")

        # Test with a specific date
        reference = datetime(2026, 1, 15, 12, 0, 0, tzinfo=ZoneInfo("UTC"))
        start, end = config.get_period_boundaries(reference)

        # Should be Jan 1 to Feb 1
        assert start.day == 1
        assert start.month == 1
        assert end.day == 1
        assert end.month == 2

    def test_period_boundaries_daily(self):
        """Test daily period boundary calculation."""
        config = ExternalAgentBudgetConfig(period="daily", timezone="UTC")

        reference = datetime(2026, 1, 15, 14, 30, 0, tzinfo=ZoneInfo("UTC"))
        start, end = config.get_period_boundaries(reference)

        # Should be start of day to start of next day
        assert start.day == 15
        assert start.hour == 0
        assert end.day == 16
        assert end.hour == 0

    def test_period_boundaries_weekly(self):
        """Test weekly period boundary calculation."""
        config = ExternalAgentBudgetConfig(period="weekly", timezone="UTC")

        # Wednesday Jan 15, 2026
        reference = datetime(2026, 1, 15, 12, 0, 0, tzinfo=ZoneInfo("UTC"))
        start, end = config.get_period_boundaries(reference)

        # Should start on Monday (Jan 13)
        assert start.weekday() == 0  # Monday
        # End should be 7 days later
        assert (end - start).days == 7

    def test_rollover_configuration(self):
        """Test rollover configuration."""
        config = ExternalAgentBudgetConfig(
            rollover_unused=True,
            max_rollover_percentage=0.25
        )
        assert config.rollover_unused is True
        assert config.max_rollover_percentage == 0.25

    def test_enforcement_modes(self):
        """Test enforcement mode options."""
        hard_config = ExternalAgentBudgetConfig(enforcement_mode="hard")
        assert hard_config.enforcement_mode == "hard"

        soft_config = ExternalAgentBudgetConfig(enforcement_mode="soft")
        assert soft_config.enforcement_mode == "soft"


class TestBudgetAlertConfig:
    """Tests for BudgetAlertConfig dataclass."""

    def test_default_alert_config(self):
        """Test default alert configuration."""
        config = BudgetAlertConfig()
        assert config.webhook_url is None
        assert config.email_recipients == []
        assert len(config.thresholds) == 4

    def test_custom_alert_config(self):
        """Test custom alert configuration."""
        config = BudgetAlertConfig(
            webhook_url="https://hooks.slack.com/...",
            email_recipients=["admin@company.com", "finance@company.com"],
            thresholds=[0.50, 0.75, 0.90],
            cooldown_minutes=30
        )
        assert config.webhook_url is not None
        assert len(config.email_recipients) == 2
        assert len(config.thresholds) == 3
        assert config.cooldown_minutes == 30

    def test_alert_behavior_options(self):
        """Test alert behavior options."""
        config = BudgetAlertConfig(
            alert_once_per_threshold=False,
            include_forecast=True
        )
        assert config.alert_once_per_threshold is False
        assert config.include_forecast is True
