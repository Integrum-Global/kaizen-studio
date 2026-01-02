# Load Testing Infrastructure - File Index

Complete index of all load testing files and their purposes.

## Directory Structure

```
deploy/loadtest/
├── README.md                           # Comprehensive documentation
├── QUICK_START.md                      # 5-minute quick start guide
├── INDEX.md                            # This file
├── Makefile                            # Convenient shortcuts
├── run-loadtest.sh                     # Main test execution script
├── k8s-loadtest-job.yaml              # Kubernetes job definitions
├── .github-workflows-example.yml      # CI/CD example
├── .gitignore                         # Git ignore rules
│
├── scripts/                           # k6 test scripts
│   ├── smoke.js                       # Smoke test (5 VUs, 30s)
│   ├── auth.js                        # Authentication test (50 VUs, 4m)
│   ├── agents.js                      # Agents CRUD test (100 VUs, 16m)
│   ├── pipelines.js                   # Pipelines CRUD test (100 VUs, 16m)
│   ├── stress.js                      # Stress test (500 VUs, 20m)
│   ├── spike.js                       # Spike test (1000 VUs, 7m)
│   └── soak.js                        # Soak test (100 VUs, 30m)
│
├── lib/                               # Shared utilities
│   └── helpers.js                     # Common functions and classes
│
├── config/                            # Configuration files
│   ├── thresholds.json               # Performance SLOs
│   └── environments.json             # Environment configurations
│
└── reports/                           # Test reports (gitignored)
    └── .gitkeep                       # Keep directory in git
```

## File Purposes

### Documentation Files

#### `README.md`
**Purpose**: Comprehensive documentation covering all aspects of load testing.

**Contents**:
- Overview and quick start
- Installation instructions
- Detailed test descriptions
- Running tests guide
- Interpreting results
- CI/CD integration examples
- Kubernetes deployment
- Performance baselines
- Troubleshooting guide

**When to use**: Primary reference for all load testing activities.

---

#### `QUICK_START.md`
**Purpose**: Fast track to running your first load test in 5 minutes.

**Contents**:
- Installation steps
- First test execution
- Common commands
- Results interpretation
- Quick troubleshooting

**When to use**: First-time users, quick reference.

---

#### `INDEX.md` (this file)
**Purpose**: Navigate the load testing infrastructure.

**Contents**:
- Complete file listing
- File purposes
- Usage recommendations

**When to use**: Finding specific files or understanding structure.

---

### Execution Scripts

#### `run-loadtest.sh`
**Purpose**: Main entry point for running all load tests.

**Features**:
- Environment selection (local, dev, staging, prod)
- Test type selection (smoke, auth, agents, etc.)
- Custom options (VUs, duration, base URL)
- HTML report generation
- Summary export

**Usage**:
```bash
./run-loadtest.sh [test_type] [environment] [options]
```

**Examples**:
```bash
./run-loadtest.sh smoke local
./run-loadtest.sh stress staging --html
./run-loadtest.sh auth staging --vus 100 --duration 10m
```

---

#### `Makefile`
**Purpose**: Convenient shortcuts for common operations.

**Features**:
- Quick test commands
- Dependency checking
- k6 installation
- Cleanup tasks
- CI/CD shortcuts

**Usage**:
```bash
make smoke-staging      # Run smoke test on staging
make stress-staging     # Run stress test on staging
make all-staging        # Run all tests on staging
make clean              # Clean up reports
```

**Common targets**:
- `make help` - Show all available commands
- `make install` - Install k6
- `make check` - Verify dependencies
- `make view-report` - Open latest HTML report
- `make summary` - Show latest test summary

---

### Test Scripts (k6)

#### `scripts/smoke.js`
**Test Type**: Smoke Test

**Purpose**: Quick validation that the system handles minimal load.

**Configuration**:
- VUs: 5
- Duration: 30 seconds
- Thresholds: Lenient (p95 < 500ms)

**Scenarios**:
1. Health check
2. User registration
3. Authentication verification
4. List operations
5. Logout

**When to run**:
- Every deployment
- Pre-production validation
- Quick sanity checks
- CI/CD pipeline gates

---

#### `scripts/auth.js`
**Test Type**: Authentication Load Test

**Purpose**: Test authentication flows under load.

**Configuration**:
- VUs: 10 → 50 (ramping)
- Duration: 4 minutes
- Thresholds: p95 < 300ms, error rate < 2%

**Scenarios**:
- 30% new user registration
- 70% existing user login/logout

**Metrics**:
- `login_duration`
- `logout_duration`
- `auth_errors`

**When to run**:
- Daily on development
- Before authentication changes
- After security updates

---

#### `scripts/agents.js`
**Test Type**: Agents CRUD Load Test

**Purpose**: Test agent management operations under load.

**Configuration**:
- VUs: 20 → 100 (ramping)
- Duration: 16 minutes
- Thresholds: p95 < 400ms, error rate < 2%

**Scenarios**:
- 30% create agents
- 40% list agents (pagination)
- 20% update agents
- 10% delete agents

**Metrics**:
- `agent_crud_duration`
- `api_errors`

**When to run**:
- Weekly on staging
- Before agent-related releases
- Capacity planning

---

#### `scripts/pipelines.js`
**Test Type**: Pipelines CRUD Load Test

**Purpose**: Test pipeline management operations under load.

**Configuration**:
- VUs: 20 → 100 (ramping)
- Duration: 16 minutes
- Thresholds: p95 < 400ms, error rate < 2%

**Scenarios**:
- 30% create pipelines
- 40% list pipelines (pagination)
- 20% update pipelines
- 10% delete pipelines

**Metrics**:
- `pipeline_crud_duration`
- `api_errors`

**When to run**:
- Weekly on staging
- Before pipeline-related releases
- Capacity planning

---

#### `scripts/stress.js`
**Test Type**: Stress Test

**Purpose**: Find the system's breaking point.

**Configuration**:
- VUs: 50 → 500 (ramping)
- Duration: 20 minutes
- Thresholds: Very lenient (p95 < 1000ms, error rate < 10%)

**Scenarios**:
- Mixed workload (50% list, 30% create, 20% metadata)
- 2-4 operations per iteration

**Expected outcomes**:
- Identify maximum capacity
- Find bottlenecks
- Observe auto-scaling
- Performance degradation patterns

**When to run**:
- Monthly on staging
- Capacity planning
- Performance tuning
- Infrastructure changes

---

#### `scripts/spike.js`
**Test Type**: Spike Test

**Purpose**: Test sudden extreme load spikes.

**Configuration**:
- VUs: 20 → 1000 (sudden spike)
- Duration: 7 minutes
- Thresholds: Very lenient (p95 < 2000ms, error rate < 15%)

**Scenarios**:
- Read-heavy workload (50% agents, 30% pipelines, 15% metrics, 5% writes)

**Expected outcomes**:
- Auto-scaling responsiveness
- Recovery behavior
- Resource exhaustion handling
- Error patterns during spike

**When to run**:
- Monthly on staging
- Before major campaigns
- Testing DDoS protection
- Validating burst capacity

---

#### `scripts/soak.js`
**Test Type**: Soak/Endurance Test

**Purpose**: Detect memory leaks and gradual degradation.

**Configuration**:
- VUs: 100 (sustained)
- Duration: 30 minutes
- Thresholds: Same as normal load (p95 < 300ms)

**Scenarios**:
- Realistic user workflows
- Agent management workflow
- Pipeline management workflow
- Monitoring workflow

**Validation**:
- Compare first 10 min vs last 10 min
- Memory usage trends
- Connection pool stability

**When to run**:
- Quarterly on staging
- Overnight/weekend runs
- After memory-related changes
- Long-term stability validation

---

### Shared Utilities

#### `lib/helpers.js`
**Purpose**: Shared utilities for all k6 tests.

**Contents**:

**Custom Metrics**:
- `loginDuration` - Login latency trend
- `logoutDuration` - Logout latency trend
- `agentCrudDuration` - Agent CRUD operations
- `pipelineCrudDuration` - Pipeline CRUD operations
- `authErrors` - Authentication error counter
- `apiErrors` - API error counter
- `successRate` - Overall success rate

**Helper Functions**:
- `randomString(length)` - Generate random strings
- `randomEmail()` - Generate test email addresses
- `generateAgentData()` - Create random agent payloads
- `generatePipelineData()` - Create random pipeline payloads
- `generateDeploymentData(pipelineId)` - Create deployment payloads
- `randomSleep(min, max)` - Random sleep duration
- `validateResponse(response, status, fields)` - Response validation
- `getConfig()` - Environment-specific configuration

**UserSession Class**:
- `register(email, password, org)` - Register new user
- `login(email, password)` - Login with credentials
- `logout()` - Logout current session
- `getMe()` - Get current user info
- `createAgent(data)` - Create agent
- `getAgent(id)` - Get agent by ID
- `listAgents(page, limit)` - List agents
- `updateAgent(id, updates)` - Update agent
- `deleteAgent(id)` - Delete agent
- `createPipeline(data)` - Create pipeline
- `getPipeline(id)` - Get pipeline by ID
- `listPipelines(page, limit)` - List pipelines
- `updatePipeline(id, updates)` - Update pipeline
- `deletePipeline(id)` - Delete pipeline
- `createDeployment(data)` - Create deployment
- `getMetrics(timeRange)` - Get metrics

**When to modify**:
- Adding new API endpoints
- Creating new test scenarios
- Adding custom metrics
- Extending validation logic

---

### Configuration Files

#### `config/thresholds.json`
**Purpose**: Performance SLOs (Service Level Objectives) for all environments.

**Structure**:
```json
{
  "environments": {
    "development": { "http_req_duration": { "p95": 500, "p99": 1000 } },
    "staging": { "http_req_duration": { "p95": 300, "p99": 700 } },
    "production": { "http_req_duration": { "p95": 200, "p99": 500 } }
  },
  "custom_metrics": { "login_duration": { "p95": 250, "p99": 500 } },
  "test_specific": { "smoke": {}, "stress": {}, ... },
  "baseline_performance": { "version": "1.0.0", "metrics": {} }
}
```

**Usage**:
- Reference for expected performance
- CI/CD pass/fail criteria
- Performance regression detection
- Capacity planning targets

**Update frequency**:
- After each release (baseline metrics)
- When SLOs change
- After infrastructure changes

---

#### `config/environments.json`
**Purpose**: Environment configurations and test recommendations.

**Structure**:
```json
{
  "environments": {
    "local": { "base_url": "http://localhost:8000" },
    "development": { "base_url": "https://dev..." },
    "staging": { "base_url": "https://staging..." },
    "production": { "base_url": "https://..." }
  },
  "test_recommendations": {
    "smoke": { "environments": ["local", "development", "staging", "production"] },
    "stress": { "environments": ["staging"] }
  },
  "ci_cd_integration": { "pull_request": {}, "nightly": {} }
}
```

**Usage**:
- Environment-specific settings
- Test scheduling recommendations
- CI/CD integration guide
- Monitoring configuration

---

### Kubernetes Files

#### `k8s-loadtest-job.yaml`
**Purpose**: Run load tests from within Kubernetes cluster.

**Resources**:
1. **ConfigMap** (`loadtest-scripts`) - Test scripts
2. **Job** (`kaizen-studio-loadtest-smoke`) - One-time test execution
3. **K6 CRD** (`kaizen-studio-stress-test`) - k6 Operator integration
4. **CronJob** (`kaizen-studio-loadtest-nightly`) - Scheduled tests
5. **PVC** (`loadtest-reports`) - Report storage
6. **ServiceAccount** (`loadtest-runner`) - RBAC permissions

**Usage**:
```bash
# Deploy
kubectl apply -f k8s-loadtest-job.yaml

# Run job
kubectl create job --from=cronjob/kaizen-studio-loadtest-nightly manual-run-001

# View logs
kubectl logs -f job/kaizen-studio-loadtest-smoke

# Clean up
kubectl delete -f k8s-loadtest-job.yaml
```

**When to use**:
- Testing from within cluster
- Scheduled automated tests
- CI/CD in Kubernetes environments
- Reducing network latency

---

### CI/CD Files

#### `.github-workflows-example.yml`
**Purpose**: GitHub Actions workflow example for automated load testing.

**Jobs**:
1. **smoke-test** - On every PR
2. **full-suite** - On merge to main (smoke, auth, agents, pipelines)
3. **nightly-tests** - Scheduled at 2 AM (stress, spike)
4. **manual-test** - Workflow dispatch for manual runs

**Features**:
- PR comments with results
- Artifact uploads
- Slack notifications
- Matrix strategy for parallel tests

**Setup**:
```bash
# Copy to your repo
cp .github-workflows-example.yml ../.github/workflows/loadtest.yml

# Set secrets in GitHub
# - STAGING_URL
# - PRODUCTION_URL
# - SLACK_WEBHOOK_URL
```

---

### Reports

#### `reports/` directory
**Purpose**: Store test execution reports.

**Generated files**:
- `*_summary.json` - k6 JSON summary
- `*_output.txt` - Full console output
- `*.html` - Interactive HTML report

**Naming convention**:
```
{test_type}_{environment}_{timestamp}_{suffix}
smoke_staging_20241216_143052_summary.json
smoke_staging_20241216_143052_output.txt
smoke_staging_20241216_143052.html
```

**Retention**:
- Local: Clean periodically with `make clean`
- CI/CD: 30-90 days as artifacts

---

## Quick Reference

### Running Tests

| Command | Purpose |
|---------|---------|
| `./run-loadtest.sh smoke local` | Quick local test |
| `make smoke-staging` | Staging smoke test |
| `make stress-staging` | Find breaking point |
| `make all-staging` | Full test suite |

### Viewing Results

| Command | Purpose |
|---------|---------|
| `make view-report` | Open latest HTML report |
| `make summary` | Show latest summary |
| `ls reports/` | List all reports |

### Maintenance

| Command | Purpose |
|---------|---------|
| `make clean` | Remove report files |
| `make install` | Install k6 |
| `make check` | Verify setup |

---

## Getting Help

1. **Quick Start**: Read [QUICK_START.md](QUICK_START.md)
2. **Full Docs**: Read [README.md](README.md)
3. **File Reference**: This document
4. **k6 Docs**: https://k6.io/docs/

---

**Last Updated**: 2024-12-16
**Version**: 1.0.0
