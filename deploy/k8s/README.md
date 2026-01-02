# Kaizen Studio - Kubernetes Deployment Guide

Production-ready Kubernetes deployment manifests for Kaizen Studio with multi-environment support (dev/staging/prod).

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Deployment Structure](#deployment-structure)
5. [Environment Configuration](#environment-configuration)
6. [Security Best Practices](#security-best-practices)
7. [Deployment Commands](#deployment-commands)
8. [Monitoring and Observability](#monitoring-and-observability)
9. [Scaling and High Availability](#scaling-and-high-availability)
10. [Troubleshooting](#troubleshooting)
11. [Maintenance Operations](#maintenance-operations)

---

## Architecture Overview

Kaizen Studio consists of four main components deployed in Kubernetes:

```
┌─────────────────────────────────────────────────────────────┐
│                      Ingress (NGINX)                        │
│              TLS Termination + Path Routing                 │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐            ┌─────────────────┐
│    Frontend     │            │    Backend      │
│  (React/Nginx)  │            │   (FastAPI)     │
│   Replicas: 2   │            │   Replicas: 3+  │
└─────────────────┘            └────────┬────────┘
                                        │
                        ┌───────────────┴───────────────┐
                        │                               │
                        ▼                               ▼
              ┌──────────────────┐          ┌──────────────────┐
              │   PostgreSQL     │          │      Redis       │
              │  (StatefulSet)   │          │   (Deployment)   │
              │   Replicas: 1    │          │   Replicas: 1    │
              └──────────────────┘          └──────────────────┘
```

### Component Details

- **Frontend**: React SPA served via Nginx
- **Backend**: FastAPI application with auto-scaling (HPA)
- **PostgreSQL**: Persistent database with StatefulSet
- **Redis**: Cache and session storage
- **Ingress**: NGINX Ingress Controller with TLS

---

## Prerequisites

### Required Tools

```bash
# kubectl (Kubernetes CLI)
kubectl version --client

# kustomize (Configuration management)
kustomize version

# Optional: helm (for installing operators)
helm version
```

### Kubernetes Cluster

- **Minimum Requirements**:
  - Kubernetes v1.24+
  - 4 CPU cores, 8GB RAM
  - 100GB storage

- **Recommended**:
  - Kubernetes v1.27+
  - 8+ CPU cores, 16GB+ RAM
  - 500GB SSD storage
  - Multiple nodes for HA

### Required Cluster Add-ons

1. **NGINX Ingress Controller**
   ```bash
   helm install nginx-ingress ingress-nginx/ingress-nginx \
     --namespace ingress-nginx --create-namespace
   ```

2. **cert-manager (for TLS certificates)**
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

3. **metrics-server (for HPA)**
   ```bash
   kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
   ```

4. **Prometheus Operator (optional, for monitoring)**
   ```bash
   helm install prometheus prometheus-community/kube-prometheus-stack \
     --namespace monitoring --create-namespace
   ```

---

## Quick Start

### 1. Generate Secrets

Generate secure secrets for your environment:

```bash
cd deploy/k8s/scripts
./generate-secrets.sh production
```

This will:
- Generate random secure passwords for PostgreSQL and Redis
- Generate JWT secret keys
- Create Kubernetes secrets in the target namespace
- Save backup to `.secrets-production.env` (DO NOT commit!)

### 2. Configure Environment

Edit the overlay configuration for your environment:

```bash
# For production
vim deploy/k8s/overlays/prod/configmap-patch.yaml
```

Update:
- `CORS_ORIGINS`: Your frontend domain
- `FRONTEND_URL`: Your frontend URL
- Ingress domain in `base/ingress.yaml`

### 3. Build Docker Images

Build and push Docker images to your registry:

```bash
# Backend
docker build -t your-registry/kaizen-studio-backend:v1.0.0 .
docker push your-registry/kaizen-studio-backend:v1.0.0

# Frontend
cd apps/web
docker build -t your-registry/kaizen-studio-web:v1.0.0 .
docker push your-registry/kaizen-studio-web:v1.0.0
```

Update image references in `overlays/prod/kustomization.yaml`.

### 4. Deploy to Kubernetes

Deploy using the automated script:

```bash
cd deploy/k8s/scripts
./deploy.sh prod
```

Or manually with kustomize:

```bash
kubectl apply -k deploy/k8s/overlays/prod
```

### 5. Verify Deployment

```bash
# Check pod status
kubectl get pods -n kaizen-studio

# Check services
kubectl get services -n kaizen-studio

# Check ingress
kubectl get ingress -n kaizen-studio

# Test health endpoint
kubectl port-forward svc/backend-service 8000:8000 -n kaizen-studio
curl http://localhost:8000/health
```

---

## Deployment Structure

```
deploy/k8s/
├── base/                          # Base Kubernetes manifests
│   ├── namespace.yaml             # Namespace definition
│   ├── configmap.yaml             # Non-sensitive configuration
│   ├── secrets.yaml               # Secret template (DO NOT use as-is)
│   ├── backend.yaml               # Backend deployment + service + HPA
│   ├── web.yaml              # Frontend deployment + service
│   ├── postgresql.yaml            # PostgreSQL StatefulSet + PVC
│   ├── redis.yaml                 # Redis deployment + PVC
│   ├── ingress.yaml               # Ingress + TLS configuration
│   ├── resource-quota.yaml        # Resource limits per namespace
│   ├── network-policy.yaml        # Network isolation policies
│   ├── monitoring.yaml            # Prometheus ServiceMonitor + alerts
│   └── kustomization.yaml         # Base kustomization
│
├── overlays/                      # Environment-specific overrides
│   ├── dev/                       # Development environment
│   │   ├── kustomization.yaml     # Dev-specific config
│   │   ├── configmap-patch.yaml   # Dev ConfigMap overrides
│   │   └── backend-patch.yaml     # Dev resource adjustments
│   ├── staging/                   # Staging environment
│   │   ├── kustomization.yaml
│   │   ├── configmap-patch.yaml
│   │   └── backend-patch.yaml
│   └── prod/                      # Production environment
│       ├── kustomization.yaml
│       ├── configmap-patch.yaml
│       ├── backend-patch.yaml
│       └── postgresql-patch.yaml
│
├── scripts/                       # Deployment automation scripts
│   ├── generate-secrets.sh        # Generate secure secrets
│   ├── deploy.sh                  # Deploy to Kubernetes
│   └── rollback.sh                # Rollback deployment
│
└── README.md                      # This file
```

---

## Environment Configuration

### Development (dev)

- **Namespace**: `kaizen-studio-dev`
- **Replicas**: Backend (1), Frontend (1)
- **Resources**: Lower limits for cost optimization
- **Debug**: Enabled with verbose logging
- **Domain**: `dev.yourdomain.com`

```bash
./deploy.sh dev
```

### Staging (staging)

- **Namespace**: `kaizen-studio-staging`
- **Replicas**: Backend (2), Frontend (2)
- **Resources**: Medium scale
- **Debug**: Disabled
- **Domain**: `staging.yourdomain.com`

```bash
./deploy.sh staging
```

### Production (prod)

- **Namespace**: `kaizen-studio`
- **Replicas**: Backend (3+), Frontend (2)
- **Resources**: Full scale with auto-scaling
- **Debug**: Disabled
- **JWT**: RS256 algorithm for enhanced security
- **Domain**: `studio.yourdomain.com`

```bash
./deploy.sh prod
```

---

## Security Best Practices

### 1. Secrets Management

**DO NOT** commit secrets to version control. Use one of these approaches:

#### Option A: Kubernetes Secrets (Manual)
```bash
./scripts/generate-secrets.sh production
```

#### Option B: External Secrets Operator
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: kaizen-studio-secrets
spec:
  secretStoreRef:
    name: aws-secrets-manager
  target:
    name: kaizen-studio-secrets
  data:
  - secretKey: postgres-password
    remoteRef:
      key: kaizen-studio/postgres-password
```

#### Option C: Sealed Secrets
```bash
kubeseal --format=yaml < secrets.yaml > sealed-secrets.yaml
```

### 2. TLS/SSL Configuration

The ingress is configured for automatic TLS via cert-manager:

```yaml
# In base/ingress.yaml
metadata:
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - studio.yourdomain.com
    secretName: kaizen-studio-tls
```

**Before deployment**, update:
1. Email in ClusterIssuer (`base/ingress.yaml`)
2. Domain in Ingress rules

### 3. Network Policies

Network policies restrict traffic between pods:

- Backend can only access PostgreSQL and Redis
- PostgreSQL accepts connections only from Backend
- Redis accepts connections only from Backend
- Frontend is isolated (static assets only)

### 4. Pod Security

All pods run with:
- Non-root user
- Read-only root filesystem (where possible)
- Dropped capabilities
- Security context constraints

### 5. Resource Limits

All containers have:
- CPU/memory requests (guaranteed resources)
- CPU/memory limits (maximum resources)
- Pod Disruption Budgets (maintain availability)

---

## Deployment Commands

### Initial Deployment

```bash
# 1. Generate secrets
cd deploy/k8s/scripts
./generate-secrets.sh prod

# 2. Deploy application
./deploy.sh prod
```

### Update Deployment

```bash
# Update image tags in overlays/prod/kustomization.yaml
# Then apply changes
kubectl apply -k deploy/k8s/overlays/prod
```

### Rollback Deployment

```bash
# Rollback to previous version
./scripts/rollback.sh prod

# Rollback to specific revision
./scripts/rollback.sh prod 3
```

### Scale Manually

```bash
# Scale backend replicas
kubectl scale deployment backend --replicas=5 -n kaizen-studio

# Scale web replicas
kubectl scale deployment frontend --replicas=3 -n kaizen-studio
```

### View Deployment History

```bash
# Backend deployment history
kubectl rollout history deployment/backend -n kaizen-studio

# View specific revision
kubectl rollout history deployment/backend --revision=3 -n kaizen-studio
```

---

## Monitoring and Observability

### Health Checks

All services expose health endpoints:

```bash
# Backend health
curl https://studio.yourdomain.com/health

# Or via port-forward
kubectl port-forward svc/backend-service 8000:8000 -n kaizen-studio
curl http://localhost:8000/health
```

### Logs

```bash
# Stream backend logs
kubectl logs -f -l app.kubernetes.io/component=backend -n kaizen-studio

# Stream all logs
kubectl logs -f -l app.kubernetes.io/name=kaizen-studio -n kaizen-studio

# View logs from specific pod
kubectl logs backend-xyz-123 -n kaizen-studio

# Previous container logs (if crashed)
kubectl logs backend-xyz-123 -n kaizen-studio --previous
```

### Metrics

Access Prometheus metrics (if Prometheus Operator is installed):

```bash
# Port forward to Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Open http://localhost:9090
```

Key metrics to monitor:
- `http_requests_total`: Request rate
- `http_request_duration_seconds`: Latency
- `pg_stat_database_numbackends`: Database connections
- `redis_memory_used_bytes`: Redis memory usage

### Grafana Dashboards

Import the included dashboard:

```bash
kubectl apply -f deploy/k8s/base/monitoring.yaml
```

Access Grafana:
```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Username: admin, Password: prom-operator
```

### Alerts

Configured alerts (via PrometheusRule):

- **BackendHighErrorRate**: Error rate > 5%
- **BackendHighLatency**: P95 latency > 1s
- **BackendDown**: Backend unavailable for 2+ minutes
- **PostgresDown**: PostgreSQL unavailable for 1+ minute
- **RedisDown**: Redis unavailable for 1+ minute
- **PodCrashLooping**: Pod restarting frequently

---

## Scaling and High Availability

### Horizontal Pod Autoscaler (HPA)

Backend auto-scales based on CPU and memory:

```yaml
# Production: 3-20 replicas
minReplicas: 3
maxReplicas: 20
metrics:
- type: Resource
  resource:
    name: cpu
    target:
      type: Utilization
      averageUtilization: 60
```

Monitor HPA status:
```bash
kubectl get hpa -n kaizen-studio
kubectl describe hpa backend-hpa -n kaizen-studio
```

### Pod Disruption Budgets

Maintains minimum replicas during disruptions:

```yaml
# Backend: Keep at least 2 pods running
minAvailable: 2

# Frontend: Keep at least 1 pod running
minAvailable: 1
```

### Database High Availability

**Note**: Current configuration uses single PostgreSQL instance.

For production HA, consider:

1. **PostgreSQL High Availability Operator**:
   - Zalando Postgres Operator
   - CrunchyData PGO
   - CloudNativePG

2. **Managed Database Services**:
   - AWS RDS for PostgreSQL
   - Google Cloud SQL
   - Azure Database for PostgreSQL

3. **Backup and Restore**:
   ```bash
   # Backup
   kubectl exec -n kaizen-studio postgres-0 -- \
     pg_dump -U kaizen_user kaizen_studio > backup.sql

   # Restore
   kubectl exec -i -n kaizen-studio postgres-0 -- \
     psql -U kaizen_user kaizen_studio < backup.sql
   ```

### Redis High Availability

For production, use Redis Sentinel or Redis Cluster:

```bash
# Install Redis HA with Helm
helm install redis bitnami/redis \
  --namespace kaizen-studio \
  --set architecture=replication \
  --set auth.password=your_password
```

---

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n kaizen-studio

# Describe pod for events
kubectl describe pod backend-xyz-123 -n kaizen-studio

# Check logs
kubectl logs backend-xyz-123 -n kaizen-studio

# Check events
kubectl get events -n kaizen-studio --sort-by='.lastTimestamp'
```

Common issues:
- **ImagePullBackOff**: Check image name and registry credentials
- **CrashLoopBackOff**: Check application logs
- **Pending**: Check resource availability and PVC status

### Database Connection Failed

```bash
# Check PostgreSQL pod
kubectl get pod -l app.kubernetes.io/component=postgres -n kaizen-studio

# Test database connection from backend
kubectl exec -it deploy/backend -n kaizen-studio -- bash
psql $DATABASE_URL -c "SELECT 1"

# Check PostgreSQL logs
kubectl logs -l app.kubernetes.io/component=postgres -n kaizen-studio
```

### Redis Connection Failed

```bash
# Check Redis pod
kubectl get pod -l app.kubernetes.io/component=redis -n kaizen-studio

# Test Redis connection
kubectl exec -it deploy/backend -n kaizen-studio -- bash
redis-cli -u $REDIS_URL ping

# Check Redis logs
kubectl logs -l app.kubernetes.io/component=redis -n kaizen-studio
```

### Ingress Not Working

```bash
# Check ingress status
kubectl get ingress -n kaizen-studio
kubectl describe ingress kaizen-studio-ingress -n kaizen-studio

# Check cert-manager certificate
kubectl get certificate -n kaizen-studio
kubectl describe certificate kaizen-studio-tls -n kaizen-studio

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

### High Memory Usage

```bash
# Check resource usage
kubectl top pods -n kaizen-studio
kubectl top nodes

# Get detailed metrics
kubectl describe pod backend-xyz-123 -n kaizen-studio | grep -A 5 "Limits\|Requests"

# Increase resource limits in overlays
vim deploy/k8s/overlays/prod/backend-patch.yaml
kubectl apply -k deploy/k8s/overlays/prod
```

### Performance Issues

1. **Check HPA status**:
   ```bash
   kubectl get hpa -n kaizen-studio
   ```

2. **Increase replicas temporarily**:
   ```bash
   kubectl scale deployment backend --replicas=10 -n kaizen-studio
   ```

3. **Check database performance**:
   ```bash
   kubectl exec -it postgres-0 -n kaizen-studio -- psql -U kaizen_user -d kaizen_studio
   # Run: SELECT * FROM pg_stat_activity;
   ```

4. **Check Redis memory**:
   ```bash
   kubectl exec -it deploy/redis -n kaizen-studio -- redis-cli INFO memory
   ```

---

## Maintenance Operations

### Update Application

```bash
# 1. Build new image
docker build -t your-registry/kaizen-studio-backend:v1.1.0 .
docker push your-registry/kaizen-studio-backend:v1.1.0

# 2. Update image tag in kustomization
vim deploy/k8s/overlays/prod/kustomization.yaml
# Change: newTag: v1.1.0

# 3. Apply update
kubectl apply -k deploy/k8s/overlays/prod

# 4. Monitor rollout
kubectl rollout status deployment/backend -n kaizen-studio
```

### Database Backup

```bash
# Create backup
kubectl exec -n kaizen-studio postgres-0 -- \
  pg_dump -U kaizen_user -Fc kaizen_studio > backup-$(date +%Y%m%d).dump

# Automated backup to S3 (example)
kubectl exec -n kaizen-studio postgres-0 -- \
  pg_dump -U kaizen_user -Fc kaizen_studio | \
  aws s3 cp - s3://your-bucket/backups/kaizen-studio-$(date +%Y%m%d).dump
```

### Database Migration

```bash
# Run migrations from backend pod
kubectl exec -it deploy/backend -n kaizen-studio -- bash
alembic upgrade head
```

### Restart Services

```bash
# Restart backend (rolling restart)
kubectl rollout restart deployment/backend -n kaizen-studio

# Restart all deployments
kubectl rollout restart deployment -n kaizen-studio

# Force delete stuck pod
kubectl delete pod backend-xyz-123 -n kaizen-studio --force --grace-period=0
```

### Clean Up Resources

```bash
# Delete specific environment
kubectl delete namespace kaizen-studio-dev

# Delete all resources (DANGER!)
kubectl delete namespace kaizen-studio
```

---

## Production Checklist

Before going to production, verify:

- [ ] Secrets generated with strong passwords
- [ ] Image tags use specific versions (not `latest`)
- [ ] Domain configured in Ingress
- [ ] TLS certificate email updated in ClusterIssuer
- [ ] CORS origins configured correctly
- [ ] Resource limits appropriate for load
- [ ] HPA configured with appropriate thresholds
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured
- [ ] Log aggregation configured
- [ ] Network policies reviewed
- [ ] Database persistence verified (PVC)
- [ ] Disaster recovery plan documented
- [ ] Load testing completed

---

## Support and Documentation

- **Kaizen Studio Docs**: `../../docs/`
- **Kubernetes Docs**: https://kubernetes.io/docs/
- **Kustomize Docs**: https://kustomize.io/
- **NGINX Ingress**: https://kubernetes.github.io/ingress-nginx/
- **cert-manager**: https://cert-manager.io/docs/

---

## License

Copyright © 2024 Kaizen Studio. All rights reserved.
