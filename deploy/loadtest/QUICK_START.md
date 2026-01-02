# Quick Start Guide - Kaizen Studio Load Testing

## 5-Minute Quick Start

### 1. Install k6

```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6

# Verify installation
k6 version
```

### 2. Run Your First Test

```bash
# Navigate to load test directory
cd /Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio/deploy/loadtest

# Run smoke test locally
./run-loadtest.sh smoke local
```

**Expected Output**:
```
============================================
Running smoke test on local
============================================
ℹ Base URL: http://localhost:8000
ℹ Started: Mon Dec 16 14:30:52 PST 2024

     ✓ health check status 200
     ✓ register status 201

     checks.........................: 100.00% ✓ 150 ✗ 0
     http_req_duration..............: avg=142ms p(95)=284ms p(99)=456ms
     http_req_failed................: 0.00% ✓ 0 ✗ 150
     success_rate...................: 100.00%
```

### 3. Run Tests on Different Environments

```bash
# Development
./run-loadtest.sh smoke development

# Staging (with HTML report)
./run-loadtest.sh smoke staging --html

# Production (smoke test only!)
./run-loadtest.sh smoke production
```

### 4. View Results

```bash
# Reports are saved in reports/ directory
ls -la reports/

# Open HTML report in browser
open reports/smoke_staging_20241216_143052.html  # macOS
xdg-open reports/smoke_staging_20241216_143052.html  # Linux
```

---

## Common Test Commands

### Smoke Test (30 seconds)
```bash
./run-loadtest.sh smoke staging
```
Quick validation that the system works.

### Authentication Test (4 minutes)
```bash
./run-loadtest.sh auth staging
```
Test login/logout flows under load.

### Agents CRUD Test (16 minutes)
```bash
./run-loadtest.sh agents staging
```
Test agent creation, reading, updating, deletion.

### Stress Test (20 minutes)
```bash
./run-loadtest.sh stress staging --html
```
Find the breaking point (ramps up to 500 VUs).

### Spike Test (7 minutes)
```bash
./run-loadtest.sh spike staging --html
```
Test sudden traffic bursts (spikes to 1000 VUs).

### Soak Test (30 minutes)
```bash
./run-loadtest.sh soak staging --html
```
Detect memory leaks and degradation over time.

---

## Custom Options

### Override Virtual Users
```bash
./run-loadtest.sh auth staging --vus 100
```

### Override Duration
```bash
./run-loadtest.sh auth staging --duration 10m
```

### Custom Base URL
```bash
./run-loadtest.sh smoke development --base-url http://localhost:8000
```

### Multiple Options
```bash
./run-loadtest.sh stress staging --vus 200 --duration 15m --html
```

---

## Understanding Results

### Key Metrics to Watch

**1. HTTP Request Duration (Latency)**
```
http_req_duration: avg=145ms p(95)=284ms p(99)=456ms
```
- **p(95) < 200ms** → Good
- **p(95) 200-500ms** → Acceptable
- **p(95) > 500ms** → Needs optimization

**2. Error Rate**
```
http_req_failed: 0.45% ✓ 205 ✗ 45473
```
- **< 1%** → Good
- **1-5%** → Investigate
- **> 5%** → Critical issue

**3. Success Rate**
```
success_rate: 99.55%
```
- **> 99%** → Production ready
- **95-99%** → Acceptable for staging
- **< 95%** → Not ready

### Pass/Fail

Tests **PASS** if all thresholds are met:
- ✓ p95 latency < 200ms
- ✓ Error rate < 1%
- ✓ Success rate > 99%

Tests **FAIL** if any threshold fails:
- ✗ p95 latency = 543ms (exceeds 200ms)

---

## Troubleshooting

### "k6: command not found"
```bash
# Install k6
brew install k6  # macOS
sudo apt-get install k6  # Linux
```

### "Cannot connect to localhost:8000"
```bash
# Make sure backend is running
cd /Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio
python -m uvicorn studio.main:app --reload

# Or use different environment
./run-loadtest.sh smoke staging
```

### High error rates (> 5%)
```bash
# Check backend logs
tail -f /var/log/kaizen-studio/backend.log

# Check database connections
# Check rate limiting settings
# Reduce VUs: ./run-loadtest.sh auth staging --vus 20
```

### High latency (p95 > 500ms)
```bash
# Check backend resources
kubectl top pods -n kaizen-studio

# Check database slow queries
# Optimize endpoints
# Add caching
```

---

## Next Steps

1. **Read Full Documentation**: See [README.md](README.md) for comprehensive guide
2. **Set Up CI/CD**: Integrate load tests into your pipeline
3. **Configure Monitoring**: Connect to Prometheus/Grafana
4. **Establish Baselines**: Run tests after each release and track trends
5. **Schedule Regular Tests**: Set up CronJobs for nightly/weekly tests

---

## Quick Reference

| Test Type | VUs | Duration | Use Case |
|-----------|-----|----------|----------|
| smoke | 5 | 30s | Quick validation |
| auth | 10-50 | 4m | Authentication flows |
| agents | 20-100 | 16m | Agent CRUD operations |
| pipelines | 20-100 | 16m | Pipeline CRUD operations |
| stress | 50-500 | 20m | Find breaking point |
| spike | 20-1000 | 7m | Test burst handling |
| soak | 100 | 30m | Detect memory leaks |

---

## Help

```bash
# Show usage
./run-loadtest.sh

# Show help for specific test
k6 run --help

# Check k6 version
k6 version
```

---

**Need Help?** See [README.md](README.md) or check [k6 documentation](https://k6.io/docs/)
