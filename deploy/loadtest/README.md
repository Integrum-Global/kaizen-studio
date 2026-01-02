# Kaizen Studio Load Testing Infrastructure

Comprehensive load testing infrastructure using [k6](https://k6.io/) - a modern, open-source load testing tool designed for developers.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Interpreting Results](#interpreting-results)
- [CI/CD Integration](#cicd-integration)
- [Kubernetes Testing](#kubernetes-testing)
- [Performance Baselines](#performance-baselines)
- [Troubleshooting](#troubleshooting)

## Overview

This load testing infrastructure provides:

- **7 Test Scenarios**: Smoke, Auth, Agents, Pipelines, Stress, Spike, and Soak tests
- **Multi-Environment Support**: Local, Development, Staging, Production
- **Automated Reporting**: HTML and JSON reports with detailed metrics
- **Kubernetes Integration**: Run tests from within your cluster
- **CI/CD Ready**: Easy integration with GitHub Actions, GitLab CI, etc.

## Quick Start

```bash
# Install k6
brew install k6  # macOS
# or
sudo apt-get install k6  # Linux

# Navigate to load test directory
cd deploy/loadtest

# Run a smoke test locally
./run-loadtest.sh smoke local

# Run stress test on staging
./run-loadtest.sh stress staging --html
```

## Installation

### macOS
```bash
brew install k6
```

### Linux (Debian/Ubuntu)
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Windows
```bash
choco install k6
```

### Docker
```bash
docker pull grafana/k6:latest
```

## Test Types

### 1. Smoke Test (`smoke.js`)
**Purpose**: Quick validation that the system works with minimal load.

- **VUs**: 5 virtual users
- **Duration**: 30 seconds
- **Use Cases**:
  - Pre-deployment validation
  - Quick sanity checks
  - CI/CD pipeline gates
  - Post-deployment verification

```bash
./run-loadtest.sh smoke development
```

**SLOs**:
- p95 latency < 500ms
- Error rate < 5%
- Success rate > 95%

---

### 2. Authentication Test (`auth.js`)
**Purpose**: Test authentication flows under load.

- **VUs**: Ramps from 10 → 50 virtual users
- **Duration**: 4 minutes
- **Scenarios**:
  - 30% new user registration
  - 70% existing user login/logout

```bash
./run-loadtest.sh auth staging
```

**SLOs**:
- p95 login latency < 250ms
- p95 logout latency < 150ms
- Error rate < 2%

---

### 3. Agents Test (`agents.js`)
**Purpose**: Test agent CRUD operations under load.

- **VUs**: Ramps from 20 → 100 virtual users
- **Duration**: 16 minutes
- **Scenarios**:
  - 30% create agents
  - 40% list agents
  - 20% update agents
  - 10% delete agents

```bash
./run-loadtest.sh agents staging
```

**SLOs**:
- p95 CRUD latency < 400ms
- Error rate < 2%

---

### 4. Pipelines Test (`pipelines.js`)
**Purpose**: Test pipeline CRUD operations under load.

- **VUs**: Ramps from 20 → 100 virtual users
- **Duration**: 16 minutes
- **Scenarios**:
  - 30% create pipelines
  - 40% list pipelines
  - 20% update pipelines
  - 10% delete pipelines

```bash
./run-loadtest.sh pipelines staging
```

**SLOs**:
- p95 CRUD latency < 400ms
- Error rate < 2%

---

### 5. Stress Test (`stress.js`)
**Purpose**: Find the system's breaking point by gradually increasing load.

- **VUs**: Ramps from 50 → 500 virtual users
- **Duration**: 20 minutes
- **Use Cases**:
  - Capacity planning
  - Identifying bottlenecks
  - Testing auto-scaling
  - Finding resource limits

```bash
./run-loadtest.sh stress staging
```

**SLOs** (Lenient):
- p95 latency < 1000ms
- Error rate < 10%
- Success rate > 85%

**Expected Outcomes**:
- Identify maximum capacity (e.g., 300 VUs before degradation)
- Observe auto-scaling behavior
- Find bottlenecks (CPU, memory, database connections)

---

### 6. Spike Test (`spike.js`)
**Purpose**: Test system behavior under sudden extreme load spikes.

- **VUs**: Spikes from 20 → 1000 virtual users
- **Duration**: 7 minutes
- **Use Cases**:
  - Simulate viral events
  - Test marketing campaign readiness
  - Validate DDoS protection
  - Test recovery behavior

```bash
./run-loadtest.sh spike staging
```

**SLOs** (Very Lenient):
- p95 latency < 2000ms
- Error rate < 15%
- Success rate > 80%

---

### 7. Soak Test (`soak.js`)
**Purpose**: Detect memory leaks and gradual performance degradation.

- **VUs**: 100 virtual users sustained
- **Duration**: 30 minutes (or longer)
- **Use Cases**:
  - Memory leak detection
  - Database connection pool issues
  - Gradual resource exhaustion
  - Long-term stability validation

```bash
./run-loadtest.sh soak staging
```

**SLOs**:
- p95 latency < 300ms (no degradation over time)
- Error rate < 2%
- Compare first 10 min vs last 10 min for degradation

---

## Running Tests

### Basic Usage

```bash
./run-loadtest.sh [test_type] [environment] [options]
```

### Examples

```bash
# Smoke test on local
./run-loadtest.sh smoke local

# Authentication test on staging
./run-loadtest.sh auth staging

# Stress test with HTML report
./run-loadtest.sh stress staging --html

# Custom VUs and duration
./run-loadtest.sh auth staging --vus 100 --duration 10m

# Override base URL
./run-loadtest.sh smoke development --base-url http://localhost:8000

# Run all tests sequentially
./run-loadtest.sh all staging --html
```

### Environment URLs

| Environment | Base URL |
|------------|----------|
| `local` | http://localhost:8000 |
| `development` | https://dev.kaizen-studio.example.com |
| `staging` | https://staging.kaizen-studio.example.com |
| `production` | https://kaizen-studio.example.com |

### Test Options

| Option | Description | Example |
|--------|-------------|---------|
| `--vus NUM` | Override virtual users | `--vus 200` |
| `--duration TIME` | Override duration | `--duration 10m` |
| `--base-url URL` | Override base URL | `--base-url http://localhost:8000` |
| `--html` | Generate HTML report | `--html` |
| `--summary` | Generate JSON summary | `--summary` |

## Interpreting Results

### Key Metrics

#### 1. HTTP Request Duration
```
http_req_duration............: avg=145.2ms min=42ms med=128ms max=987ms p(95)=284ms p(99)=456ms
```

- **avg**: Average latency (should be < 200ms)
- **p(95)**: 95th percentile (target: < 200ms for production)
- **p(99)**: 99th percentile (target: < 500ms for production)
- **max**: Maximum latency (watch for outliers)

#### 2. Request Rate
```
http_reqs....................: 45678 requests (254.3 req/s)
```

- **Total requests**: Total HTTP requests made
- **req/s**: Requests per second (throughput)

#### 3. Error Rate
```
http_req_failed..............: 0.45% ✓ 205 ✗ 45473
```

- **Target**: < 1% for production
- **Acceptable**: < 2% for staging
- **Concerning**: > 5%

#### 4. Success Rate
```
success_rate.................: 99.55%
```

- **Target**: > 99% for production
- **Acceptable**: > 98% for staging

### Custom Metrics

#### Authentication Metrics
```
login_duration...............: avg=187ms p(95)=234ms p(99)=412ms
logout_duration..............: avg=98ms p(95)=142ms p(99)=218ms
auth_errors..................: 12 errors
```

#### CRUD Metrics
```
agent_crud_duration..........: avg=312ms p(95)=456ms p(99)=678ms
pipeline_crud_duration.......: avg=298ms p(95)=421ms p(99)=645ms
```

### HTML Reports

HTML reports are automatically generated in `reports/` directory:

```
reports/
├── smoke_staging_20241216_143052.html
├── smoke_staging_20241216_143052_summary.json
└── smoke_staging_20241216_143052_output.txt
```

Open the `.html` file in a browser for interactive visualizations.

### Pass/Fail Criteria

k6 tests pass if all thresholds are met:

```javascript
thresholds: {
  http_req_duration: ['p(95)<200', 'p(99)<500'],  // ✓ PASS
  http_req_failed: ['rate<0.01'],                  // ✓ PASS
  success_rate: ['rate>0.99']                      // ✗ FAIL (98% < 99%)
}
```

**Result**: Test FAILS if any threshold fails.

## CI/CD Integration

### GitHub Actions

```yaml
name: Load Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run smoke test
        run: |
          cd deploy/loadtest
          ./run-loadtest.sh smoke staging --html

      - name: Upload report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: load-test-report
          path: deploy/loadtest/reports/

  nightly-stress:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
      - uses: actions/checkout@v3

      - name: Install k6
        run: |
          sudo apt-get update
          sudo apt-get install k6

      - name: Run stress test
        run: |
          cd deploy/loadtest
          ./run-loadtest.sh stress staging --html

      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Stress test failed on staging!"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### GitLab CI

```yaml
stages:
  - test
  - loadtest

smoke-test:
  stage: test
  image: grafana/k6:latest
  script:
    - cd deploy/loadtest
    - k6 run --env ENVIRONMENT=staging --env BASE_URL=$STAGING_URL scripts/smoke.js
  artifacts:
    reports:
      junit: reports/*.xml
    paths:
      - reports/
  only:
    - merge_requests
    - main

nightly-stress:
  stage: loadtest
  image: grafana/k6:latest
  script:
    - cd deploy/loadtest
    - k6 run --env ENVIRONMENT=staging --env BASE_URL=$STAGING_URL scripts/stress.js
  artifacts:
    paths:
      - reports/
  only:
    - schedules
```

## Kubernetes Testing

### Install k6 Operator

```bash
kubectl apply -f https://github.com/grafana/k6-operator/releases/latest/download/bundle.yaml
```

### Run Tests from Cluster

```bash
# Apply the load test job
kubectl apply -f k8s-loadtest-job.yaml

# Watch the job
kubectl get jobs -n kaizen-studio -w

# View logs
kubectl logs -f job/kaizen-studio-loadtest-smoke -n kaizen-studio

# Get results
kubectl describe job kaizen-studio-loadtest-smoke -n kaizen-studio
```

### Scheduled Tests (CronJob)

The `k8s-loadtest-job.yaml` includes a CronJob that runs nightly at 2 AM:

```bash
# View scheduled jobs
kubectl get cronjobs -n kaizen-studio

# Trigger manual run
kubectl create job --from=cronjob/kaizen-studio-loadtest-nightly manual-run-001 -n kaizen-studio
```

## Performance Baselines

### Production SLOs

| Metric | Target | Description |
|--------|--------|-------------|
| p95 Latency | < 200ms | 95% of requests complete within 200ms |
| p99 Latency | < 500ms | 99% of requests complete within 500ms |
| Error Rate | < 1% | Less than 1% of requests fail |
| Availability | > 99.9% | System is available 99.9% of the time |
| Success Rate | > 99% | More than 99% of operations succeed |

### Baseline Metrics (Update After Each Release)

Run baseline tests after each release to track performance trends:

```bash
# Run full suite and save baselines
./run-loadtest.sh all staging --html

# Compare with previous baselines
# Check p95 latency degradation < 20%
# Check error rate increase < 2x
```

**Example Baseline** (v1.0.0):

| Endpoint | p95 Latency | p99 Latency | Error Rate |
|----------|-------------|-------------|------------|
| POST /auth/login | 187ms | 234ms | 0.12% |
| POST /auth/logout | 98ms | 142ms | 0.08% |
| GET /agents | 145ms | 218ms | 0.15% |
| POST /agents | 312ms | 456ms | 0.45% |
| GET /pipelines | 132ms | 201ms | 0.18% |
| POST /pipelines | 298ms | 421ms | 0.52% |
| GET /metrics | 78ms | 124ms | 0.05% |

## Troubleshooting

### High Error Rates

**Symptom**: Error rate > 5%

**Possible Causes**:
1. **Database Connection Pool Exhausted**
   - Check database max connections
   - Increase pool size in backend config
   - Monitor `db.pool.active` metric

2. **Rate Limiting**
   - Increase rate limit thresholds
   - Whitelist load test IPs
   - Use multiple test users

3. **Backend Overload**
   - Increase replica count
   - Add horizontal pod autoscaling
   - Optimize slow endpoints

**Debug Commands**:
```bash
# Check backend logs
kubectl logs -f deployment/kaizen-studio-backend -n kaizen-studio

# Check database connections
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check resource usage
kubectl top pods -n kaizen-studio
```

---

### High Latency

**Symptom**: p95 latency > 500ms

**Possible Causes**:
1. **Slow Database Queries**
   - Enable query logging
   - Add missing indexes
   - Optimize N+1 queries

2. **External API Calls**
   - Add timeouts to external calls
   - Implement circuit breakers
   - Use async processing

3. **Insufficient Resources**
   - Increase CPU/memory limits
   - Add more replicas
   - Check for CPU throttling

**Debug Commands**:
```bash
# Enable slow query logging (PostgreSQL)
ALTER DATABASE kaizen SET log_min_duration_statement = 100;

# Check CPU throttling
kubectl describe pod <pod-name> -n kaizen-studio | grep -i throttl

# Profile backend
py-spy record -o profile.svg -- python -m uvicorn studio.main:app
```

---

### Memory Leaks (Soak Test)

**Symptom**: Memory usage increases over time

**Indicators**:
- Memory usage at 10 min: 512MB
- Memory usage at 30 min: 1.2GB
- OOMKilled pods

**Possible Causes**:
1. **Unclosed Database Connections**
   - Always use context managers
   - Check connection pool configuration

2. **Cached Data Not Evicted**
   - Implement cache TTL
   - Add cache size limits
   - Use LRU eviction

3. **Event Listeners Not Removed**
   - Clean up event handlers
   - Check for circular references

**Debug Commands**:
```bash
# Monitor memory over time
kubectl top pod -n kaizen-studio --containers -l app=kaizen-studio

# Get memory profile
py-spy dump --pid <PID>

# Check for leaks with memory profiler
python -m memory_profiler studio/main.py
```

---

### k6 Installation Issues

**Ubuntu/Debian**:
```bash
# If GPG key fails
curl -s https://dl.k6.io/key.gpg | sudo apt-key add -

# If repository not found
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
```

**macOS**:
```bash
# If brew install fails
brew update
brew upgrade
brew install k6
```

**Docker Alternative**:
```bash
# Run tests with Docker
docker run --rm -v $(pwd):/scripts grafana/k6:latest run /scripts/smoke.js
```

---

## Best Practices

### 1. Test Pyramid

```
        /\        Soak (Monthly)
       /  \
      /____\      Spike/Stress (Weekly)
     /      \
    /________\    Agents/Pipelines (Daily)
   /          \
  /____________\  Auth (Daily)
 /______________\ Smoke (Every Deploy)
```

### 2. Environment Strategy

- **Local**: Development and debugging
- **Development**: Feature validation
- **Staging**: Full test suite before production
- **Production**: Smoke tests only (with caution)

### 3. Timing

- **Smoke**: Every deployment (30s)
- **Auth/CRUD**: Daily on development (5-15m)
- **Stress/Spike**: Weekly on staging during off-peak (20-30m)
- **Soak**: Monthly on staging overnight (30-60m)

### 4. Monitoring Integration

Always run load tests with monitoring enabled:

- **Prometheus**: Scrape metrics during tests
- **Grafana**: Create load test dashboards
- **Alerting**: Set up alerts for SLO violations

### 5. Baseline Tracking

After each release:
1. Run full test suite on staging
2. Record baseline metrics in `config/thresholds.json`
3. Compare with previous release
4. Alert if degradation > 20%

---

## Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [Grafana k6 Operator](https://github.com/grafana/k6-operator)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/test-types/)

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review k6 documentation
3. Open an issue in the project repository
4. Contact the platform team

---

**Last Updated**: 2024-12-16
**Version**: 1.0.0
