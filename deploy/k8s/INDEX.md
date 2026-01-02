# Kaizen Studio Kubernetes Deployment - File Index

Quick reference to all deployment files and their purpose.

## Quick Navigation

- [Quick Start](QUICK_START.md) - Deploy in 5 minutes
- [Full Documentation](README.md) - Comprehensive guide
- [Deployment Summary](DEPLOYMENT_SUMMARY.md) - Overview and checklist
- [Changelog](CHANGELOG.md) - Version history

---

## Base Manifests (`base/`)

### Core Application
| File | Purpose | Resources |
|------|---------|-----------|
| `namespace.yaml` | Namespace definition | Namespace |
| `configmap.yaml` | Non-sensitive configuration | ConfigMap |
| `secrets.yaml` | Secret template (DO NOT USE AS-IS) | Secret |

### Backend
| File | Purpose | Resources |
|------|---------|-----------|
| `backend.yaml` | FastAPI backend | Deployment, Service, HPA, PDB |

### Frontend
| File | Purpose | Resources |
|------|---------|-----------|
| `web.yaml` | React/Nginx frontend | Deployment, Service, PDB |

### Database
| File | Purpose | Resources |
|------|---------|-----------|
| `postgresql.yaml` | PostgreSQL database | StatefulSet, Services, ConfigMap, PVC |
| `redis.yaml` | Redis cache | Deployment, Service, PVC |

### Networking
| File | Purpose | Resources |
|------|---------|-----------|
| `ingress.yaml` | Ingress + TLS | Ingress, ClusterIssuer (prod + staging) |
| `network-policy.yaml` | Network isolation | NetworkPolicy (4 policies) |

### Resource Management
| File | Purpose | Resources |
|------|---------|-----------|
| `resource-quota.yaml` | Resource limits | ResourceQuota, LimitRange |

### Monitoring
| File | Purpose | Resources |
|------|---------|-----------|
| `monitoring.yaml` | Prometheus integration | ServiceMonitor, PrometheusRule, ConfigMap |

### Build
| File | Purpose | Type |
|------|---------|------|
| `kustomization.yaml` | Base kustomization config | Kustomize |

**Total Base Files**: 12 YAML files

---

## Environment Overlays (`overlays/`)

### Development (`overlays/dev/`)
| File | Purpose |
|------|---------|
| `kustomization.yaml` | Dev kustomization (1 replica, debug enabled) |
| `configmap-patch.yaml` | Dev config overrides |
| `backend-patch.yaml` | Dev resource adjustments |

### Staging (`overlays/staging/`)
| File | Purpose |
|------|---------|
| `kustomization.yaml` | Staging kustomization (2 replicas) |
| `configmap-patch.yaml` | Staging config overrides |
| `backend-patch.yaml` | Staging resource adjustments |

### Production (`overlays/prod/`)
| File | Purpose |
|------|---------|
| `kustomization.yaml` | Production kustomization (3+ replicas, RS256) |
| `configmap-patch.yaml` | Production config overrides |
| `backend-patch.yaml` | Production resource adjustments |
| `postgresql-patch.yaml` | Production PostgreSQL adjustments (100Gi) |

**Total Overlay Files**: 10 YAML files

---

## Automation Scripts (`scripts/`)

| Script | Purpose | Usage |
|--------|---------|-------|
| `generate-secrets.sh` | Generate secure random secrets | `./generate-secrets.sh prod` |
| `deploy.sh` | Automated deployment with validation | `./deploy.sh prod` |
| `rollback.sh` | Rollback to previous/specific revision | `./rollback.sh prod [revision]` |
| `validate.sh` | Validate manifests before deployment | `./validate.sh prod` |

**Total Scripts**: 4 shell scripts (all executable)

---

## Documentation Files

| File | Purpose | Size |
|------|---------|------|
| `README.md` | Comprehensive deployment guide | 15+ pages |
| `QUICK_START.md` | 5-minute deployment guide | 3 pages |
| `DEPLOYMENT_SUMMARY.md` | Overview, checklist, operations | 8 pages |
| `CHANGELOG.md` | Version history | 2 pages |
| `INDEX.md` | This file - quick reference | 2 pages |
| `.gitignore` | Ignore sensitive files | 1 page |

**Total Documentation**: 6 markdown files

---

## Resource Summary

### Total Files Created
- **YAML Manifests**: 22 files (12 base + 10 overlays)
- **Scripts**: 4 files (all executable)
- **Documentation**: 6 files
- **Total**: 32 files

### Directory Structure
```
deploy/k8s/
├── base/                  # 12 files
│   ├── backend.yaml
│   ├── configmap.yaml
│   ├── web.yaml
│   ├── ingress.yaml
│   ├── kustomization.yaml
│   ├── monitoring.yaml
│   ├── namespace.yaml
│   ├── network-policy.yaml
│   ├── postgresql.yaml
│   ├── redis.yaml
│   ├── resource-quota.yaml
│   └── secrets.yaml
├── overlays/              # 10 files
│   ├── dev/               # 3 files
│   ├── staging/           # 3 files
│   └── prod/              # 4 files
├── scripts/               # 4 files
│   ├── deploy.sh
│   ├── generate-secrets.sh
│   ├── rollback.sh
│   └── validate.sh
├── .gitignore
├── CHANGELOG.md
├── DEPLOYMENT_SUMMARY.md
├── INDEX.md
├── QUICK_START.md
└── README.md
```

---

## Kubernetes Resources Deployed

### Per Environment (Production)

| Component | Type | Replicas | Auto-Scale |
|-----------|------|----------|------------|
| Backend | Deployment | 3 | 3-20 (HPA) |
| Frontend | Deployment | 2 | Manual |
| PostgreSQL | StatefulSet | 1 | N/A |
| Redis | Deployment | 1 | N/A |

### Additional Resources
- Services: 5 (backend, frontend, postgres x2, redis)
- Ingress: 1 (with TLS)
- ConfigMaps: 2 (app config, postgres config)
- Secrets: 1 (credentials)
- PVCs: 2 (postgres 100Gi, redis 10Gi)
- HPA: 1 (backend)
- PDB: 2 (backend, frontend)
- NetworkPolicies: 4 (backend, frontend, postgres, redis)
- ResourceQuota: 1
- LimitRange: 1
- ServiceMonitor: 1
- PrometheusRule: 1 (with 9 alerts)

**Total Resources**: ~30 Kubernetes objects per environment

---

## Configuration Matrix

### Environment Comparison

| Setting | Development | Staging | Production |
|---------|-------------|---------|------------|
| Namespace | kaizen-studio-dev | kaizen-studio-staging | kaizen-studio |
| Backend Replicas | 1 | 2 | 3 |
| HPA Max | 3 | 5 | 20 |
| Debug | true | false | false |
| Log Level | debug | info | info |
| JWT Algorithm | HS256 | HS256 | RS256 |
| PostgreSQL Storage | 50Gi | 50Gi | 100Gi |
| Backend CPU | 200m-1000m | 500m-2000m | 1000m-4000m |
| Backend Memory | 512Mi-2Gi | 1-4Gi | 2-8Gi |

---

## Deployment Workflows

### Initial Deployment
1. Validate: `./scripts/validate.sh prod`
2. Generate secrets: `./scripts/generate-secrets.sh prod`
3. Deploy: `./scripts/deploy.sh prod`

### Update Deployment
1. Build new images
2. Update image tags in overlay
3. Validate: `./scripts/validate.sh prod`
4. Apply: `kubectl apply -k overlays/prod`

### Rollback
1. Check history: `kubectl rollout history deployment/backend -n kaizen-studio`
2. Rollback: `./scripts/rollback.sh prod [revision]`

### Monitoring
1. View logs: `kubectl logs -f -l app.kubernetes.io/component=backend -n kaizen-studio`
2. Check metrics: Port forward to Prometheus/Grafana
3. View alerts: Check Prometheus alerts

---

## Key Features

### Security
- Non-root containers
- Network policies
- TLS termination
- Secrets management
- Security contexts
- Resource limits

### High Availability
- Multiple replicas
- Pod anti-affinity
- Pod Disruption Budgets
- Rolling updates
- Health checks
- Auto-scaling

### Observability
- Prometheus metrics
- Structured logging
- Health endpoints
- Grafana dashboards
- Alert rules

### Automation
- Secret generation
- Deployment validation
- Automated deployment
- Automated rollback
- Health monitoring

---

## Prerequisites Checklist

Before deploying, ensure you have:

- [ ] Kubernetes cluster v1.24+ running
- [ ] kubectl installed and configured
- [ ] NGINX Ingress Controller installed
- [ ] cert-manager installed
- [ ] metrics-server installed (for HPA)
- [ ] Domain DNS configured
- [ ] Container registry access
- [ ] Images built and pushed
- [ ] Secrets generated
- [ ] Configuration reviewed

---

## Support Resources

- **Kaizen Studio Docs**: `../../docs/`
- **Kubernetes**: https://kubernetes.io/docs/
- **Kustomize**: https://kustomize.io/
- **NGINX Ingress**: https://kubernetes.github.io/ingress-nginx/
- **cert-manager**: https://cert-manager.io/
- **Prometheus Operator**: https://prometheus-operator.dev/

---

**Version**: 1.0.0
**Last Updated**: 2024-12-16
**Status**: Production Ready
