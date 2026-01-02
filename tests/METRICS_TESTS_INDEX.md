# Metrics Test Suite Index

## Quick Navigation

### Test Files

1. **Tier 1 - Unit Tests**
   - File: `tests/unit/test_metrics_service.py`
   - Tests: 33
   - Duration: <1 minute
   - Focus: Service logic, calculations
   - Mocking: Yes (dependencies)

2. **Tier 2 - Integration Tests**
   - File: `tests/integration/test_metrics_api.py`
   - Tests: 29
   - Duration: <3 minutes
   - Focus: API endpoints, real database
   - Mocking: NO (real infrastructure)

3. **Tier 3 - E2E Tests**
   - File: `tests/e2e/test_metrics_workflow.py`
   - Tests: 11
   - Duration: <2 minutes
   - Focus: Complete workflows, accuracy
   - Mocking: NO (real infrastructure)

---

## Test Breakdown by Functionality

### 1. Metric Recording (17 tests)

**Unit Tests (6 tests)**
```python
# tests/unit/test_metrics_service.py :: TestMetricsRecording

test_record_metric_basic()                           # Basic recording
test_record_metric_with_error()                      # Error handling
test_record_metric_generates_execution_id()          # ID generation
test_record_metric_uses_provided_execution_id()      # Provided ID
test_record_metric_default_values()                  # Defaults
test_record_metric_calls_workflow()                  # Workflow integration
```

**Integration Tests (5 tests)**
```python
# tests/integration/test_metrics_api.py :: TestMetricsRecordingIntegration

test_record_metric_endpoint()                        # POST /metrics/record
test_record_metric_with_error_info()                 # Error tracking
test_record_metric_missing_required_field()          # Validation: agent_id
test_record_metric_missing_status()                  # Validation: status
test_record_multiple_metrics()                       # Sequential records
```

**E2E Tests (0 dedicated, covered in workflows)**

---

### 2. Metrics Summary (22 tests)

**Unit Tests (8 tests)**
```python
# tests/unit/test_metrics_service.py :: TestMetricsSummary

test_get_summary_no_metrics()                        # Empty handling
test_get_summary_single_metric()                     # Single aggregation
test_get_summary_multiple_metrics()                  # Multiple aggregation
test_get_summary_error_rate_calculation()            # Error rate (75%)
test_get_summary_with_deployment_filter()            # Deploy filter
test_get_summary_with_agent_filter()                 # Agent filter
test_get_summary_with_date_range_filter()            # Date range
test_get_summary_missing_filters()                   # No filters
```

**Integration Tests (3 tests)**
```python
# tests/integration/test_metrics_api.py :: TestMetricsSummaryEndpoint

test_get_summary_endpoint()                          # GET /metrics/summary
test_get_summary_with_filters()                      # Deploy + agent filters
test_get_summary_with_date_range()                   # Date range filtering
```

**E2E Tests (11 tests, multiple workflows test summary)**
- Full lifecycle test
- Dashboard accuracy test
- Cost tracking test
- Latency statistics test
- Error rate test
- Token tracking test

---

### 3. Timeseries Data (19 tests)

**Unit Tests (7 tests)**
```python
# tests/unit/test_metrics_service.py :: TestMetricsTimeseries

test_get_timeseries_latency_metric()                 # Latency aggregation
test_get_timeseries_tokens_metric()                  # Token aggregation
test_get_timeseries_errors_metric()                  # Error count
test_get_timeseries_cost_metric()                    # Cost aggregation
test_get_timeseries_hour_interval()                  # Hour bucketing
test_get_timeseries_week_interval()                  # Week bucketing
test_get_timeseries_day_interval()                   # Day bucketing (implicit)
```

**Integration Tests (6 tests)**
```python
# tests/integration/test_metrics_api.py :: TestMetricsTimeseriesEndpoint

test_get_timeseries_latency()                        # Latency endpoint
test_get_timeseries_tokens()                         # Token endpoint
test_get_timeseries_errors()                         # Error endpoint
test_get_timeseries_cost()                           # Cost endpoint
test_get_timeseries_invalid_metric()                 # Bad metric type
test_get_timeseries_invalid_interval()               # Bad interval
```

**E2E Tests (1 test, multi-day scenario)**
- `test_metrics_timeseries_data_accuracy()` - 3 days, daily bucketing

---

### 4. Top Errors Analysis (20 tests)

**Unit Tests (6 tests)**
```python
# tests/unit/test_metrics_service.py :: TestMetricsErrors

test_get_top_errors_no_errors()                      # Empty list
test_get_top_errors_single_error()                   # Single type
test_get_top_errors_multiple_types()                 # 3 types ranked
test_get_top_errors_respects_limit()                 # Limit enforcement
test_get_top_errors_unknown_type()                   # Unknown handling
test_get_top_errors_filters_by_status()              # Status filtering
```

**Integration Tests (4 tests)**
```python
# tests/integration/test_metrics_api.py :: TestMetricsErrorsEndpoint

test_get_top_errors_endpoint()                       # GET /metrics/errors
test_get_top_errors_with_limit()                     # Custom limit
test_get_top_errors_respects_limit()                 # Limit enforcement
test_get_top_errors_invalid_limit()                  # Bad limit (>100)
```

**E2E Tests (2 tests)**
- `test_metrics_workflow_with_errors()` - Error tracking & ranking
- Full lifecycle includes error analysis

---

### 5. Metrics Listing (13 tests)

**Unit Tests (3 tests)**
```python
# tests/unit/test_metrics_service.py :: TestMetricsList

test_list_metrics_calls_workflow()                   # Workflow invocation
test_list_metrics_with_filters()                     # Filters passed
test_list_metrics_extracts_records()                 # Result extraction
```

**Integration Tests (5 tests)**
```python
# tests/integration/test_metrics_api.py :: TestMetricsExecutionsEndpoint

test_list_executions_endpoint()                      # GET /metrics/executions
test_list_executions_with_filters()                  # Deploy/agent/status
test_list_executions_limit()                         # Limit enforcement
test_list_executions_invalid_limit_too_high()        # >1000 validation
test_list_executions_invalid_limit_too_low()         # <1 validation
```

**E2E Tests (1 test)**
- `test_metrics_list_with_filters()` - Filter validation

---

### 6. Dashboard Metrics (8 tests)

**Unit Tests (2 tests)**
```python
# tests/unit/test_metrics_service.py :: TestMetricsDashboard

test_get_dashboard_returns_structure()               # Structure validation
test_get_dashboard_filters_24h_metrics()             # Time window
test_get_dashboard_top_agents()                      # Agent ranking
```

**Integration Tests (2 tests)**
```python
# tests/integration/test_metrics_api.py :: TestMetricsDashboardEndpoint

test_get_dashboard_endpoint()                        # GET /metrics/dashboard
test_dashboard_summary_structure()                   # Structure check
```

**E2E Tests (1 test)**
- `test_metrics_dashboard_accuracy()` - Data accuracy validation

---

### 7. Deployment Metrics (4 tests)

**Unit Tests (1 test)**
```python
# tests/unit/test_metrics_service.py :: TestDeploymentAndAgentMetrics

test_get_deployment_metrics()                        # Retrieval
```

**Integration Tests (1 test)**
```python
# tests/integration/test_metrics_api.py :: TestMetricsDeploymentEndpoint

test_get_deployment_metrics_endpoint()               # GET /deployments/{id}
```

**E2E Tests (1 test)**
- `test_metrics_deployment_specific_workflow()` - Isolation & accuracy

---

### 8. Agent Metrics (4 tests)

**Unit Tests (1 test)**
```python
# tests/unit/test_metrics_service.py :: TestDeploymentAndAgentMetrics

test_get_agent_metrics()                             # Retrieval
```

**Integration Tests (1 test)**
```python
# tests/integration/test_metrics_api.py :: TestMetricsAgentEndpoint

test_get_agent_metrics_endpoint()                    # GET /agents/{id}
```

**E2E Tests (1 test)**
- `test_metrics_agent_specific_workflow()` - Performance tracking

---

## Test Coverage Matrix

| Component | Unit | Integration | E2E | Total |
|-----------|------|-------------|-----|-------|
| Recording | 6 | 5 | 1 | **12** |
| Summary | 8 | 3 | 8 | **19** |
| Timeseries | 7 | 6 | 1 | **14** |
| Top Errors | 6 | 4 | 2 | **12** |
| Listing | 3 | 5 | 1 | **9** |
| Dashboard | 2 | 2 | 1 | **5** |
| Deployment | 1 | 1 | 1 | **3** |
| Agent | 1 | 1 | 1 | **3** |
| **Total** | **33** | **29** | **11** | **73** |

---

## Running Tests

### Unit Tests Only
```bash
pytest tests/unit/test_metrics_service.py -v --timeout=1
```

### Integration Tests
```bash
cd tests/utils && ./test-env up
pytest tests/integration/test_metrics_api.py -v --timeout=5
cd tests/utils && ./test-env down
```

### E2E Tests
```bash
cd tests/utils && ./test-env up
pytest tests/e2e/test_metrics_workflow.py -v --timeout=10
cd tests/utils && ./test-env down
```

### All Tests
```bash
cd tests/utils && ./test-env up
pytest tests/unit/test_metrics_service.py \
        tests/integration/test_metrics_api.py \
        tests/e2e/test_metrics_workflow.py -v
cd tests/utils && ./test-env down
```

### By Category
```bash
# Recording tests
pytest -k "record" -v

# Summary tests
pytest -k "summary" -v

# Timeseries tests
pytest -k "timeseries" -v

# Error tests
pytest -k "error" -v

# Dashboard tests
pytest -k "dashboard" -v
```

---

## Key Test Data

### Calculation Test Values

**Error Rate Test (75%)**
- 3 metrics total, 1 success, 2 failures
- Expected: 66.67% error rate

**Cost Tracking**
- Costs: $0.001 - $0.005
- Expected total: $0.015
- Rounding: 4 decimals

**Latency Calculation**
- Latencies: 50, 100, 150, 200, 250ms
- Expected average: 150ms

**Token Accumulation**
- Pairs: (100,50), (200,100), (150,75)
- Expected total: ≥675 tokens

**Error Ranking**
- rate_limit: 3 occurrences (highest)
- timeout: 2 occurrences
- auth_error: 1 occurrence

---

## Validation Coverage

### Fields Tested
- organization_id (required)
- deployment_id (required)
- agent_id (required)
- execution_id (auto-generated)
- status (success/failure/timeout)
- latency_ms (optional, defaults 0)
- input_tokens (optional, defaults 0)
- output_tokens (optional, defaults 0)
- total_tokens (optional, defaults 0)
- cost_usd (optional, defaults 0.0)
- error_type (optional, null)
- error_message (optional, null)
- created_at (auto-generated)

### Filters Tested
- By organization_id
- By deployment_id
- By agent_id
- By status (success/failure)
- By date range (ISO format)
- Combined filters

### Validation Rules
- Limit min: 1
- Limit max: 1000 (executions), 100 (errors)
- Metric types: latency, tokens, errors, cost
- Intervals: hour, day, week

---

## File Locations (Absolute Paths)

- Unit Tests: `/Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio/tests/unit/test_metrics_service.py`
- Integration Tests: `/Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio/tests/integration/test_metrics_api.py`
- E2E Tests: `/Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio/tests/e2e/test_metrics_workflow.py`
- Documentation: `/Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio/tests/METRICS_TEST_SUMMARY.md`
- This Index: `/Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio/tests/METRICS_TESTS_INDEX.md`

---

## Implementation Files

- Service: `src/studio/services/metrics_service.py` (419 lines)
- API: `src/studio/api/metrics.py` (230 lines)
- Model: `src/studio/models/execution_metric.py` (40 lines)

---

**Total Test Suite: 73 tests across 3 tiers, <10 minutes execution time**
