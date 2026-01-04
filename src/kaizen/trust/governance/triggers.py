"""
Approval Trigger Evaluation Module

Provides logic for evaluating approval triggers including:
- Pattern matching (regex, JSONPath)
- Cost/token thresholds
- Rate-based triggers
- Context triggers (first invocation, new agent)
- Sensitive data detection
"""

import json
import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Protocol

from .config import ApprovalTriggerConfig


@dataclass
class TriggerContext:
    """
    Context for trigger evaluation.

    Contains all information needed to evaluate whether approval is required.

    Examples:
        >>> context = TriggerContext(
        ...     agent_id="agent-001",
        ...     user_id="user-001",
        ...     organization_id="org-001",
        ...     payload={"action": "process", "data": {"amount": 50000}},
        ...     estimated_cost=150.0,
        ...     environment="production"
        ... )
    """

    agent_id: str
    user_id: str
    organization_id: str
    payload: dict[str, Any] = field(default_factory=dict)
    estimated_cost: float = 0.0
    estimated_tokens: int = 0
    environment: str = "production"
    is_first_invocation: bool = False
    is_new_agent: bool = False
    invocation_count_in_window: int = 0


@dataclass
class TriggerResult:
    """
    Result of trigger evaluation.

    Examples:
        >>> result = TriggerResult(
        ...     triggered=True,
        ...     triggers_matched=["cost_threshold", "sensitive_data"],
        ...     reason="Cost threshold exceeded ($150.00 > $100.00) and sensitive data detected (SSN pattern)"
        ... )
    """

    triggered: bool
    triggers_matched: list[str] = field(default_factory=list)
    reason: str = ""
    details: dict[str, Any] = field(default_factory=dict)


class InvocationHistoryProvider(Protocol):
    """Protocol for accessing invocation history."""

    async def get_invocation_count(
        self,
        agent_id: str,
        user_id: str | None,
        organization_id: str,
        window_seconds: int
    ) -> int:
        """Get count of invocations in time window."""
        ...

    async def is_first_invocation(
        self,
        agent_id: str,
        user_id: str | None,
        organization_id: str
    ) -> bool:
        """Check if this is the first invocation."""
        ...


class ApprovalTriggerEvaluator:
    """
    Evaluates approval triggers for external agent invocations.

    Examples:
        >>> config = ApprovalTriggerConfig(
        ...     cost_threshold=100.0,
        ...     payload_patterns=["password", "secret"],
        ...     require_first_invocation=True
        ... )
        >>> evaluator = ApprovalTriggerEvaluator(config)
        >>> result = await evaluator.evaluate(context)
        >>> if result.triggered:
        ...     print(f"Approval required: {result.reason}")
    """

    def __init__(
        self,
        config: ApprovalTriggerConfig,
        history_provider: InvocationHistoryProvider | None = None
    ):
        """
        Initialize the trigger evaluator.

        Args:
            config: Trigger configuration
            history_provider: Optional provider for invocation history
        """
        self.config = config
        self.history_provider = history_provider

        # Compile regex patterns once
        self._payload_patterns: list[re.Pattern] = []
        self._sensitive_patterns: list[re.Pattern] = []

        for pattern in config.payload_patterns:
            try:
                self._payload_patterns.append(re.compile(pattern, re.IGNORECASE))
            except re.error:
                # Invalid pattern - skip it but log
                pass

        for pattern in config.sensitive_data_patterns:
            try:
                self._sensitive_patterns.append(re.compile(pattern))
            except re.error:
                pass

    async def evaluate(self, context: TriggerContext) -> TriggerResult:
        """
        Evaluate all configured triggers.

        Args:
            context: The trigger evaluation context

        Returns:
            TriggerResult indicating if approval is required

        Examples:
            >>> context = TriggerContext(
            ...     agent_id="agent-001",
            ...     user_id="user-001",
            ...     organization_id="org-001",
            ...     estimated_cost=150.0
            ... )
            >>> result = await evaluator.evaluate(context)
        """
        triggers_matched: list[str] = []
        reasons: list[str] = []
        details: dict[str, Any] = {}

        # Check cost threshold
        if self.config.cost_threshold is not None:
            if context.estimated_cost > self.config.cost_threshold:
                triggers_matched.append("cost_threshold")
                reasons.append(
                    f"Cost threshold exceeded (${context.estimated_cost:.2f} > ${self.config.cost_threshold:.2f})"
                )
                details["cost_threshold"] = {
                    "estimated": context.estimated_cost,
                    "threshold": self.config.cost_threshold
                }

        # Check token threshold
        if self.config.token_threshold is not None:
            if context.estimated_tokens > self.config.token_threshold:
                triggers_matched.append("token_threshold")
                reasons.append(
                    f"Token threshold exceeded ({context.estimated_tokens:,} > {self.config.token_threshold:,})"
                )
                details["token_threshold"] = {
                    "estimated": context.estimated_tokens,
                    "threshold": self.config.token_threshold
                }

        # Check first invocation
        if self.config.require_first_invocation and context.is_first_invocation:
            triggers_matched.append("first_invocation")
            reasons.append("First invocation of agent requires approval")
            details["first_invocation"] = True

        # Check new agent
        if self.config.require_new_agent and context.is_new_agent:
            triggers_matched.append("new_agent")
            reasons.append("Newly registered agent requires approval")
            details["new_agent"] = True

        # Check environment
        if self.config.require_production_approval and context.environment == "production":
            triggers_matched.append("production_environment")
            reasons.append("Production environment requires approval")
            details["environment"] = context.environment

        if context.environment in self.config.environments_requiring_approval:
            triggers_matched.append("environment_restriction")
            reasons.append(f"Environment '{context.environment}' requires approval")
            details["environment"] = context.environment

        # Check payload patterns
        payload_str = self._serialize_payload(context.payload)
        matched_patterns = self._check_payload_patterns(payload_str)
        if matched_patterns:
            triggers_matched.append("payload_pattern")
            reasons.append(f"Payload contains restricted patterns: {', '.join(matched_patterns)}")
            details["payload_patterns"] = matched_patterns

        # Check sensitive data patterns
        sensitive_matches = self._check_sensitive_data(payload_str)
        if sensitive_matches:
            triggers_matched.append("sensitive_data")
            reasons.append(f"Sensitive data detected: {', '.join(sensitive_matches)}")
            details["sensitive_data_types"] = sensitive_matches

        # Check rate trigger
        if self.config.rate_trigger_count is not None:
            count = context.invocation_count_in_window
            if count >= self.config.rate_trigger_count:
                triggers_matched.append("rate_trigger")
                reasons.append(
                    f"Rate trigger exceeded ({count} invocations in window, threshold: {self.config.rate_trigger_count})"
                )
                details["rate_trigger"] = {
                    "count": count,
                    "threshold": self.config.rate_trigger_count,
                    "window_seconds": self.config.rate_trigger_window_seconds
                }

        # Combine results
        triggered = len(triggers_matched) > 0
        reason = " | ".join(reasons) if reasons else ""

        return TriggerResult(
            triggered=triggered,
            triggers_matched=triggers_matched,
            reason=reason,
            details=details
        )

    def _serialize_payload(self, payload: dict[str, Any]) -> str:
        """Convert payload to string for pattern matching."""
        try:
            return json.dumps(payload, default=str)
        except (TypeError, ValueError):
            return str(payload)

    def _check_payload_patterns(self, payload_str: str) -> list[str]:
        """Check payload against configured patterns."""
        matched = []
        for pattern in self._payload_patterns:
            if pattern.search(payload_str):
                matched.append(pattern.pattern)
        return matched

    def _check_sensitive_data(self, payload_str: str) -> list[str]:
        """Check for sensitive data patterns."""
        detected_types = []

        # Check configured patterns
        for i, pattern in enumerate(self._sensitive_patterns):
            if pattern.search(payload_str):
                # Try to categorize the pattern
                pattern_str = pattern.pattern
                if "\\d{3}-\\d{2}-\\d{4}" in pattern_str:
                    detected_types.append("SSN")
                elif "\\d{16}" in pattern_str or "\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}" in pattern_str:
                    detected_types.append("Credit Card")
                elif "@" in pattern_str and "\\." in pattern_str:
                    detected_types.append("Email Pattern")
                else:
                    detected_types.append(f"Pattern_{i}")

        # Built-in common sensitive patterns
        builtin_patterns = {
            "SSN": r"\b\d{3}-\d{2}-\d{4}\b",
            "Credit Card": r"\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b",
            "API Key": r"(?i)(api[_-]?key|apikey|secret[_-]?key)\s*[=:]\s*['\"]?[\w\-]{20,}",
            "Password": r"(?i)(password|passwd|pwd)\s*[=:]\s*['\"]?[^\s'\"]{8,}",
        }

        for data_type, pattern in builtin_patterns.items():
            if data_type not in detected_types:
                if re.search(pattern, payload_str):
                    detected_types.append(data_type)

        return detected_types


class InMemoryHistoryProvider:
    """
    In-memory implementation of InvocationHistoryProvider.

    Useful for testing and simple deployments.
    """

    def __init__(self):
        self._invocations: list[dict[str, Any]] = []
        self._first_invocation_cache: set[str] = set()

    def record_invocation(
        self,
        agent_id: str,
        user_id: str | None,
        organization_id: str,
        timestamp: datetime | None = None
    ):
        """Record an invocation."""
        key = f"{organization_id}:{agent_id}"
        self._first_invocation_cache.add(key)

        self._invocations.append({
            "agent_id": agent_id,
            "user_id": user_id,
            "organization_id": organization_id,
            "timestamp": timestamp or datetime.utcnow()
        })

    async def get_invocation_count(
        self,
        agent_id: str,
        user_id: str | None,
        organization_id: str,
        window_seconds: int
    ) -> int:
        """Get count of invocations in time window."""
        cutoff = datetime.utcnow()
        from datetime import timedelta
        cutoff = cutoff - timedelta(seconds=window_seconds)

        count = 0
        for inv in self._invocations:
            if (
                inv["agent_id"] == agent_id
                and inv["organization_id"] == organization_id
                and (user_id is None or inv["user_id"] == user_id)
                and inv["timestamp"] >= cutoff
            ):
                count += 1

        return count

    async def is_first_invocation(
        self,
        agent_id: str,
        user_id: str | None,
        organization_id: str
    ) -> bool:
        """Check if this is the first invocation."""
        key = f"{organization_id}:{agent_id}"
        return key not in self._first_invocation_cache


__all__ = [
    "TriggerContext",
    "TriggerResult",
    "InvocationHistoryProvider",
    "ApprovalTriggerEvaluator",
    "InMemoryHistoryProvider",
]
