# Running E2E Tests

Instructions for running E2E tests in Kaizen Studio.

## Prerequisites

1. PostgreSQL database running on localhost:5432
2. Test database `kaizen_studio_test` created
3. Database user `kaizen_dev` with password `kaizen_dev_password`

## Environment Variables

Required environment variables for running tests:

```bash
DATABASE_URL="postgresql://kaizen_dev:kaizen_dev_password@localhost:5432/kaizen_studio_test"
ENVIRONMENT="testing"
```

## Running All E2E Tests

```bash
DATABASE_URL="postgresql://kaizen_dev:kaizen_dev_password@localhost:5432/kaizen_studio_test" \
ENVIRONMENT="testing" \
pytest tests/e2e/ -v
```

## Running Specific Test Files

```bash
# Agent workflow tests
pytest tests/e2e/test_agent_workflow.py -v

# API Key workflow tests
pytest tests/e2e/test_api_key_workflow.py -v

# Audit workflow tests
pytest tests/e2e/test_audit_workflow.py -v
```

## Running Tests with Timeout

Set a timeout for tests (useful for debugging hangs):

```bash
pytest tests/e2e/ -v --timeout=120
```

## Running Core Passing Tests

These test files have been verified to pass:

```bash
pytest tests/e2e/test_agent_workflow.py \
       tests/e2e/test_api_key_workflow.py \
       tests/e2e/test_audit_workflow.py \
       tests/e2e/test_abac_workflow.py \
       tests/e2e/test_auth_flow.py \
       tests/e2e/test_billing_workflow.py \
       tests/e2e/test_rbac_flow.py \
       tests/e2e/test_scaling_workflow.py \
       tests/e2e/test_sso_flow.py \
       tests/e2e/test_team_workflow.py \
       tests/e2e/test_webhook_workflow.py \
       -v
```

## Test Categories

### Fully Passing Test Files

- `test_agent_workflow.py` - Agent lifecycle, versioning, context management
- `test_api_key_workflow.py` - API key creation, validation, revocation
- `test_audit_workflow.py` - Audit logging and querying
- `test_abac_workflow.py` - Attribute-based access control
- `test_auth_flow.py` - Authentication flows
- `test_billing_workflow.py` - Billing operations
- `test_rbac_flow.py` - Role-based access control
- `test_scaling_workflow.py` - Scaling policies
- `test_sso_flow.py` - SSO integration
- `test_team_workflow.py` - Team management
- `test_webhook_workflow.py` - Webhook operations

### Partially Passing Test Files

These require additional fixes for full coverage:

- `test_connector_workflow.py` - Permission issues
- `test_deployment_workflow.py` - Endpoint path issues
- `test_metrics_workflow.py` - Datetime comparison issues
- `test_organization_workflow.py` - Authentication issues
- `test_panel_workflow.py` - Response format issues
- `test_pipeline_workflow.py` - Response format issues
- `test_promotion_workflow.py` - Permission issues

## Debugging Test Failures

Show short traceback for failures:

```bash
pytest tests/e2e/test_api_key_workflow.py -v --tb=short
```

Show only first failure:

```bash
pytest tests/e2e/ -v -x
```

Run single test by name:

```bash
pytest tests/e2e/test_agent_workflow.py::TestAgentLifecycle::test_create_and_deploy_agent -v
```
