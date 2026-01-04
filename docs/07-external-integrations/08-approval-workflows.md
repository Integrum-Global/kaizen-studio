# External Agent Approval Workflows

**Version**: 1.0.0
**Last Updated**: 2025-01-04

---

## Overview

Approval Workflows provide human-in-the-loop governance for external agent invocations. This feature enables organizations to enforce manual approval before executing high-risk, high-cost, or sensitive operations.

### What It Is

The Approval Workflow system intercepts external agent invocations that match configurable triggers and requires explicit human approval before execution proceeds. This provides:

- **Cost Control**: Require approval for expensive operations (e.g., >$100)
- **Compliance**: Enforce review for sensitive data access
- **Risk Mitigation**: Add human oversight for production environments
- **Audit Trail**: Track who approved what and when

### Key Capabilities

| Feature | Description |
|---------|-------------|
| **Trigger Evaluation** | Pattern-based, cost-based, rate-based, and environment-based triggers |
| **Multi-Approver Support** | Require multiple approvals for high-risk operations |
| **Escalation** | Automatic escalation when approvals timeout |
| **Notifications** | Email, Slack, Teams, and webhook notifications |
| **Self-Approval Prevention** | Block requestors from approving their own requests |
| **Expiration Handling** | Auto-reject or escalate expired requests |

---

## Quick Start

### 1. Configure Approval Triggers

```python
from kaizen.trust.governance.config import ApprovalTriggerConfig

# Require approval for operations costing more than $100
trigger_config = ApprovalTriggerConfig(
    cost_threshold=100.0,
    require_first_invocation=True,  # First use requires approval
)
```

### 2. Configure Approval Workflow

```python
from kaizen.trust.governance.config import ApprovalWorkflowConfig
from datetime import timedelta

workflow_config = ApprovalWorkflowConfig(
    timeout=timedelta(hours=24),
    approver_roles=["admin", "security_officer"],
    require_multiple_approvers=1,
    allow_self_approval=False,
)
```

### 3. Initialize the Approval Manager

```python
from kaizen.trust.governance import (
    ExternalAgentApprovalManager,
    InMemoryApprovalStore,
)

approval_manager = ExternalAgentApprovalManager(
    store=InMemoryApprovalStore(),  # Or DataFlowApprovalStore for production
    trigger_config=trigger_config,
    workflow_config=workflow_config,
)
```

### 4. Check and Create Approval Requests

```python
# Check if approval is required
result = await approval_manager.check_approval_required(
    agent_id="agent-001",
    payload={"action": "transfer_funds", "amount": 15000},
    user_id="user-001",
    organization_id="org-001",
    estimated_cost=150.0,
)

if result.required:
    # Create approval request
    request = await approval_manager.create_approval_request(
        agent_id="agent-001",
        payload={"action": "transfer_funds", "amount": 15000},
        user_id="user-001",
        organization_id="org-001",
        trigger_reason=result.trigger_reason,
        estimated_cost=150.0,
    )
    print(f"Approval required: {request.id}")
```

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Governance Service                        │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │ Trigger Config  │  │ Workflow Config  │                  │
│  └────────┬────────┘  └────────┬─────────┘                  │
│           │                    │                             │
│           ▼                    ▼                             │
│  ┌────────────────────────────────────────┐                 │
│  │      ApprovalTriggerEvaluator          │                 │
│  │  - Cost threshold check                 │                 │
│  │  - Pattern matching                     │                 │
│  │  - Rate-based detection                 │                 │
│  │  - Environment rules                    │                 │
│  └────────────────┬───────────────────────┘                 │
│                   │                                          │
│                   ▼                                          │
│  ┌────────────────────────────────────────┐                 │
│  │      ExternalAgentApprovalManager      │                 │
│  │  - Create approval requests             │                 │
│  │  - Process approvals/rejections         │                 │
│  │  - Handle expirations                   │                 │
│  │  - Manage escalations                   │                 │
│  └────────────────┬───────────────────────┘                 │
│                   │                                          │
│      ┌───────────┼───────────────┐                          │
│      ▼           ▼               ▼                          │
│  ┌───────┐  ┌─────────┐  ┌──────────────┐                   │
│  │ Store │  │Notifier │  │ API Endpoints│                   │
│  └───────┘  └─────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Invocation Request** → Governance Service
2. **Trigger Evaluation** → Check if approval required
3. **Request Creation** → Store pending request, notify approvers
4. **Approval/Rejection** → Update request status
5. **Notification** → Notify requestor of decision
6. **Execution** → Proceed with invocation (if approved)

---

## Trigger Configuration

### Cost-Based Triggers

Require approval when estimated cost exceeds a threshold:

```python
trigger_config = ApprovalTriggerConfig(
    cost_threshold=100.0,       # USD
    token_threshold=50000,      # Token count
)
```

### Pattern-Based Triggers

Detect sensitive content in payloads:

```python
trigger_config = ApprovalTriggerConfig(
    # Regex patterns for payload content
    payload_patterns=[
        r"password",
        r"secret",
        r"api_key",
        r"access_token",
    ],
    # PII detection patterns
    sensitive_data_patterns=[
        r"\b\d{3}-\d{2}-\d{4}\b",     # SSN format
        r"\b\d{16}\b",                 # Credit card number
        r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",  # Email
    ],
)
```

### Rate-Based Triggers

Require approval after high-volume usage:

```python
trigger_config = ApprovalTriggerConfig(
    rate_trigger_count=100,              # Trigger after 100 invocations
    rate_trigger_window_seconds=3600,    # Within 1 hour
)
```

### Environment-Based Triggers

Require approval in specific environments:

```python
trigger_config = ApprovalTriggerConfig(
    require_production_approval=True,
    environments_requiring_approval=["production", "staging"],
)
```

### Context-Based Triggers

Require approval for first-time usage:

```python
trigger_config = ApprovalTriggerConfig(
    require_first_invocation=True,   # First invocation of agent
    require_new_agent=True,          # Newly registered agents
)
```

### Combined Triggers

Combine multiple trigger types:

```python
trigger_config = ApprovalTriggerConfig(
    # Cost triggers
    cost_threshold=100.0,
    token_threshold=50000,

    # Pattern triggers
    payload_patterns=["password", "secret"],
    sensitive_data_patterns=[r"\b\d{3}-\d{2}-\d{4}\b"],

    # Rate triggers
    rate_trigger_count=100,
    rate_trigger_window_seconds=3600,

    # Environment triggers
    require_production_approval=True,

    # Context triggers
    require_first_invocation=True,
)
```

---

## Workflow Configuration

### Basic Workflow

```python
from datetime import timedelta
from kaizen.trust.governance.config import ApprovalWorkflowConfig

workflow_config = ApprovalWorkflowConfig(
    timeout=timedelta(hours=24),
    auto_reject_on_timeout=False,
    approver_roles=["admin"],
)
```

### Multi-Approver Workflow

Require multiple approvals for high-risk operations:

```python
workflow_config = ApprovalWorkflowConfig(
    require_multiple_approvers=2,      # Need 2 approvals
    approver_roles=["admin", "security_officer", "manager"],
    allow_self_approval=False,         # Requestor cannot approve
)
```

### Workflow with Escalation

Automatically escalate if not approved in time:

```python
workflow_config = ApprovalWorkflowConfig(
    timeout=timedelta(hours=24),
    escalation_timeout=timedelta(hours=4),  # Escalate after 4 hours
    escalation_to=["cto@company.com", "security-lead"],
    reminder_interval=timedelta(hours=2),    # Send reminders
)
```

### Auto-Approval Rules

Configure trusted users for automatic approval:

```python
workflow_config = ApprovalWorkflowConfig(
    auto_approve_for_admins=True,      # Admin requests auto-approve
    auto_approve_trusted_users=[
        "user-service-account",
        "user-ci-pipeline",
    ],
)
```

### Notification Settings

```python
workflow_config = ApprovalWorkflowConfig(
    notify_on_create=True,
    notify_on_decision=True,
    notify_on_expiration=True,
    notification_channels=["email", "slack"],
)
```

---

## Notification Adapters

### Email Notifications

```python
from kaizen.trust.governance.notifications import EmailNotificationAdapter

email_adapter = EmailNotificationAdapter(
    smtp_host="smtp.example.com",
    smtp_port=587,
    from_address="notifications@company.com",
    smtp_username="user",           # Optional
    smtp_password="password",       # Optional
)
```

### Slack Notifications

```python
from kaizen.trust.governance.notifications import SlackNotificationAdapter

slack_adapter = SlackNotificationAdapter(
    webhook_url="https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
    channel="#approvals",
)
```

### Microsoft Teams Notifications

```python
from kaizen.trust.governance.notifications import TeamsNotificationAdapter

teams_adapter = TeamsNotificationAdapter(
    webhook_url="https://outlook.office.com/webhook/YOUR/WEBHOOK/URL",
)
```

### Custom Webhook Notifications

```python
from kaizen.trust.governance.notifications import WebhookNotificationAdapter

webhook_adapter = WebhookNotificationAdapter(
    webhook_url="https://api.example.com/webhooks/approvals",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
)
```

### Notification Service Setup

```python
from kaizen.trust.governance.notifications import (
    ApprovalNotificationService,
    SimpleApproverResolver,
)

# Create resolver with user email mapping
resolver = SimpleApproverResolver(
    user_emails={
        "admin-001": "admin@company.com",
        "admin-002": "admin2@company.com",
        "security-lead": "security@company.com",
    }
)

# Create notification service
notification_service = ApprovalNotificationService(
    approver_resolver=resolver,
)

# Register adapters
notification_service.register_adapter("email", email_adapter)
notification_service.register_adapter("slack", slack_adapter)
```

---

## Storage Backends

### In-Memory Store (Development)

```python
from kaizen.trust.governance.store import InMemoryApprovalStore

store = InMemoryApprovalStore()
```

**Use When**: Development, testing, single-instance deployments

### DataFlow Store (Production)

```python
from kaizen.trust.governance.store import DataFlowApprovalStore
from dataflow import DataFlow

db = DataFlow("postgresql://user:pass@localhost/kaizen")
store = DataFlowApprovalStore(dataflow=db)
```

**Use When**: Production, multi-instance deployments, data persistence required

---

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/governance/{agent_id}/approvals/pending` | Get pending approvals |
| `GET` | `/governance/{agent_id}/approvals/{request_id}` | Get approval request details |
| `POST` | `/governance/{agent_id}/approvals/{request_id}/approve` | Approve a request |
| `POST` | `/governance/{agent_id}/approvals/{request_id}/reject` | Reject a request |

### Get Pending Approvals

```bash
curl -X GET \
  "https://api.example.com/governance/agent-001/approvals/pending" \
  -H "Authorization: Bearer $TOKEN"
```

**Response**:
```json
{
  "pending_requests": [
    {
      "id": "apr-001",
      "external_agent_id": "agent-001",
      "organization_id": "org-001",
      "requested_by_user_id": "user-001",
      "trigger_reason": "Cost threshold exceeded: $150.00 > $100.00",
      "estimated_cost": 150.0,
      "status": "pending",
      "created_at": "2025-01-04T12:00:00Z",
      "expires_at": "2025-01-05T12:00:00Z"
    }
  ],
  "total_count": 1
}
```

### Get Approval Request

```bash
curl -X GET \
  "https://api.example.com/governance/agent-001/approvals/apr-001" \
  -H "Authorization: Bearer $TOKEN"
```

**Response**:
```json
{
  "id": "apr-001",
  "external_agent_id": "agent-001",
  "organization_id": "org-001",
  "requested_by_user_id": "user-001",
  "trigger_reason": "Cost threshold exceeded: $150.00 > $100.00",
  "payload_summary": "Execute financial transaction: transfer $15,000",
  "estimated_cost": 150.0,
  "status": "pending",
  "required_approvals": 1,
  "approvals": [],
  "rejections": [],
  "created_at": "2025-01-04T12:00:00Z",
  "expires_at": "2025-01-05T12:00:00Z"
}
```

### Approve Request

```bash
curl -X POST \
  "https://api.example.com/governance/agent-001/approvals/apr-001/approve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approver_id": "admin-001",
    "reason": "Business justification verified"
  }'
```

**Response**:
```json
{
  "request_id": "apr-001",
  "status": "approved",
  "decision": "approved",
  "decided_by": "admin-001",
  "decided_at": "2025-01-04T14:30:00Z"
}
```

### Reject Request

```bash
curl -X POST \
  "https://api.example.com/governance/agent-001/approvals/apr-001/reject" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approver_id": "admin-001",
    "reason": "Insufficient business justification"
  }'
```

**Response**:
```json
{
  "request_id": "apr-001",
  "status": "rejected",
  "decision": "rejected",
  "decided_by": "admin-001",
  "decided_at": "2025-01-04T14:30:00Z"
}
```

---

## Integration Examples

### FastAPI Integration

```python
from fastapi import FastAPI, HTTPException, Depends
from kaizen.trust.governance import (
    ExternalAgentApprovalManager,
    ApprovalStatus,
)

app = FastAPI()

async def get_approval_manager() -> ExternalAgentApprovalManager:
    # Return your initialized approval manager
    return app.state.approval_manager

@app.post("/invoke/{agent_id}")
async def invoke_agent(
    agent_id: str,
    payload: dict,
    user_id: str,
    org_id: str,
    approval_manager: ExternalAgentApprovalManager = Depends(get_approval_manager),
):
    # Check if approval is required
    check_result = await approval_manager.check_approval_required(
        agent_id=agent_id,
        payload=payload,
        user_id=user_id,
        organization_id=org_id,
    )

    if check_result.required:
        if check_result.existing_request:
            # Check status of existing request
            if check_result.existing_request.status == ApprovalStatus.PENDING:
                raise HTTPException(
                    status_code=202,
                    detail={
                        "message": "Approval pending",
                        "request_id": check_result.existing_request.id
                    }
                )
            elif check_result.existing_request.status == ApprovalStatus.REJECTED:
                raise HTTPException(
                    status_code=403,
                    detail="Request was rejected"
                )
        else:
            # Create new approval request
            request = await approval_manager.create_approval_request(
                agent_id=agent_id,
                payload=payload,
                user_id=user_id,
                organization_id=org_id,
                trigger_reason=check_result.trigger_reason,
            )
            raise HTTPException(
                status_code=202,
                detail={
                    "message": "Approval required",
                    "request_id": request.id
                }
            )

    # Proceed with invocation
    return await execute_agent(agent_id, payload)
```

### Governance Service Integration

```python
from studio.services.governance_service import GovernanceService

# Initialize governance service with approval config
governance = GovernanceService(
    approval_trigger_config=ApprovalTriggerConfig(
        cost_threshold=100.0,
        require_first_invocation=True,
    ),
    approval_workflow_config=ApprovalWorkflowConfig(
        timeout=timedelta(hours=24),
        approver_roles=["admin"],
    ),
)
await governance.initialize()

# Use approval methods
result = await governance.check_approval_required(
    agent_id="agent-001",
    payload={},
    user_id="user-001",
    organization_id="org-001",
)

if result.required:
    request = await governance.create_approval_request(
        agent_id="agent-001",
        payload={},
        user_id="user-001",
        organization_id="org-001",
        trigger_reason=result.trigger_reason,
    )
```

---

## Error Handling

### Error Types

| Error | Description | HTTP Status |
|-------|-------------|-------------|
| `ApprovalNotFoundError` | Request ID does not exist | 404 |
| `ApprovalExpiredError` | Request has expired | 410 |
| `AlreadyDecidedError` | Request already approved/rejected | 409 |
| `SelfApprovalNotAllowedError` | Requestor tried to approve own request | 403 |
| `UnauthorizedApproverError` | User not authorized to approve | 403 |

### Error Handling Example

```python
from kaizen.trust.governance.approval_manager import (
    ApprovalNotFoundError,
    ApprovalExpiredError,
    AlreadyDecidedError,
    SelfApprovalNotAllowedError,
    UnauthorizedApproverError,
)

try:
    approved = await approval_manager.approve(
        request_id="apr-001",
        approver_id="admin-001",
        reason="Approved",
    )
except ApprovalNotFoundError:
    raise HTTPException(404, "Approval request not found")
except ApprovalExpiredError:
    raise HTTPException(410, "Approval request has expired")
except AlreadyDecidedError as e:
    raise HTTPException(409, f"Already {e.status.value}")
except SelfApprovalNotAllowedError:
    raise HTTPException(403, "Cannot approve your own request")
except UnauthorizedApproverError:
    raise HTTPException(403, "Not authorized to approve")
```

---

## Best Practices

### 1. Configure Appropriate Thresholds

Start with conservative thresholds and adjust based on operational experience:

```python
# Conservative starting point
trigger_config = ApprovalTriggerConfig(
    cost_threshold=50.0,           # Start low
    require_first_invocation=True, # Always review first use
)
```

### 2. Set Realistic Timeouts

Balance responsiveness with reviewer availability:

```python
workflow_config = ApprovalWorkflowConfig(
    timeout=timedelta(hours=24),              # Business hours consideration
    escalation_timeout=timedelta(hours=4),    # Don't wait too long
    reminder_interval=timedelta(hours=2),     # Keep it visible
)
```

### 3. Use Multi-Channel Notifications

Ensure approvers are notified through multiple channels:

```python
workflow_config = ApprovalWorkflowConfig(
    notification_channels=["email", "slack"],
)
```

### 4. Implement Escalation Paths

Always have a backup approver:

```python
workflow_config = ApprovalWorkflowConfig(
    escalation_timeout=timedelta(hours=4),
    escalation_to=["manager@company.com", "oncall-security"],
)
```

### 5. Prevent Self-Approval

Enforce separation of duties:

```python
workflow_config = ApprovalWorkflowConfig(
    allow_self_approval=False,  # Always require independent approval
)
```

### 6. Monitor Expired Requests

Set up a background job to handle expirations:

```python
async def process_expirations():
    """Run periodically (e.g., every 15 minutes)"""
    expired = await approval_manager.process_expired_requests()
    for request in expired:
        logger.warning(f"Request {request.id} expired without decision")
```

---

## Monitoring and Metrics

### Key Metrics to Track

| Metric | Description |
|--------|-------------|
| `approval_requests_created_total` | Total approval requests created |
| `approval_requests_approved_total` | Total requests approved |
| `approval_requests_rejected_total` | Total requests rejected |
| `approval_requests_expired_total` | Total requests expired |
| `approval_latency_seconds` | Time from creation to decision |
| `pending_approvals_count` | Current pending approvals |

### Health Check

```python
async def check_approval_health():
    """Include in health endpoint"""
    pending = await approval_manager.get_pending_requests(
        approver_id="system",
        organization_id=None,  # All orgs
    )

    # Alert if too many pending
    if len(pending) > 100:
        return {"status": "degraded", "pending_count": len(pending)}

    return {"status": "healthy", "pending_count": len(pending)}
```

---

## Troubleshooting

### Approval Not Triggered

**Symptoms**: Invocations proceed without approval when expected.

**Check**:
1. Verify trigger configuration is loaded
2. Check estimated cost calculation
3. Verify pattern matching is case-insensitive if needed
4. Check environment detection

```python
# Debug trigger evaluation
result = await approval_manager.check_approval_required(
    agent_id=agent_id,
    payload=payload,
    user_id=user_id,
    organization_id=org_id,
    estimated_cost=cost,
)
print(f"Required: {result.required}")
print(f"Triggers matched: {result.triggers_matched}")
print(f"Reason: {result.trigger_reason}")
```

### Notifications Not Delivered

**Symptoms**: Approvers not receiving notifications.

**Check**:
1. Verify SMTP/webhook credentials
2. Check network connectivity
3. Verify email addresses are correct
4. Check spam filters

```python
# Test notification adapter directly
success = await email_adapter.send_approval_request(
    request=test_request,
    approver=ApproverInfo(
        user_id="test",
        email="test@company.com",
    ),
)
print(f"Notification sent: {success}")
```

### Request Stuck in Pending

**Symptoms**: Requests never resolve.

**Check**:
1. Verify expiration job is running
2. Check approver roles match workflow config
3. Verify escalation is configured

```python
# Manually process expirations
expired = await approval_manager.process_expired_requests()
print(f"Processed {len(expired)} expired requests")
```

---

## Security Considerations

### Payload Sanitization

Never log or store sensitive payload data:

```python
def sanitize_payload(payload: dict) -> str:
    """Create safe summary for audit"""
    # Mask sensitive fields
    safe = {k: "***" if "password" in k.lower() else v
            for k, v in payload.items()}
    return json.dumps(safe, default=str)[:500]
```

### Audit Logging

Log all approval decisions:

```python
logger.info(
    "Approval decision",
    extra={
        "request_id": request.id,
        "agent_id": request.external_agent_id,
        "decision": decision.decision,
        "approver_id": decision.approver_id,
        "timestamp": decision.timestamp.isoformat(),
    }
)
```

### Credential Protection

Store notification credentials securely:

```python
# Use environment variables
smtp_password = os.environ.get("SMTP_PASSWORD")
slack_webhook = os.environ.get("SLACK_WEBHOOK_URL")
```

---

## Related Documentation

- [External Agents Overview](./01-overview.md)
- [User Guide](./02-user-guide.md)
- [Admin Guide](./03-admin-guide.md)
- [API Reference](./04-api-reference.md)
- [Developer Guide](./05-developer-guide.md)

---

## Support

**Questions?** Contact your Kaizen Studio administrator.

**Bugs or Feature Requests?** File an issue in the project repository.

**Security Issues?** Email security@kaizen.studio (do not file public issues).

---

## Changelog

### v1.0.0 (2025-01-04)

- Initial release
- Trigger evaluation (cost, pattern, rate, environment-based)
- Multi-approver support with escalation
- Notification adapters (Email, Slack, Teams, Webhook)
- In-memory and DataFlow storage backends
- API endpoints for approval management
- Comprehensive test suite (103 tests)
