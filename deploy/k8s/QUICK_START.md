# Kaizen Studio Kubernetes - Quick Start Guide

Get Kaizen Studio running in Kubernetes in 5 minutes.

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl installed and configured
- NGINX Ingress Controller installed
- cert-manager installed (for TLS)

## Step 1: Clone Repository

```bash
cd /path/to/kaizen-studio
```

## Step 2: Generate Secrets

```bash
cd deploy/k8s/scripts
./generate-secrets.sh production
```

This creates:
- PostgreSQL credentials
- Redis password
- JWT secret keys
- `.secrets-production.env` backup file

## Step 3: Configure Domain

Edit `deploy/k8s/base/ingress.yaml`:

```yaml
spec:
  tls:
  - hosts:
    - YOUR_DOMAIN_HERE  # Change this
    secretName: kaizen-studio-tls
  rules:
  - host: YOUR_DOMAIN_HERE  # Change this
```

Edit `deploy/k8s/base/ingress.yaml` ClusterIssuer:

```yaml
spec:
  acme:
    email: YOUR_EMAIL_HERE  # Change this
```

## Step 4: Update Image References

Edit `deploy/k8s/overlays/prod/kustomization.yaml`:

```yaml
images:
- name: kaizen-studio/backend
  newName: YOUR_REGISTRY/kaizen-studio-backend
  newTag: v1.0.0
- name: kaizen-studio/frontend
  newName: YOUR_REGISTRY/kaizen-studio-web
  newTag: v1.0.0
```

## Step 5: Build and Push Docker Images

```bash
# Backend
cd /path/to/kaizen-studio
docker build -t YOUR_REGISTRY/kaizen-studio-backend:v1.0.0 .
docker push YOUR_REGISTRY/kaizen-studio-backend:v1.0.0

# Frontend
cd apps/web
docker build -t YOUR_REGISTRY/kaizen-studio-web:v1.0.0 .
docker push YOUR_REGISTRY/kaizen-studio-web:v1.0.0
```

## Step 6: Deploy to Kubernetes

```bash
cd deploy/k8s/scripts
./deploy.sh prod
```

Or manually:

```bash
kubectl apply -k deploy/k8s/overlays/prod
```

## Step 7: Verify Deployment

```bash
# Check pods
kubectl get pods -n kaizen-studio

# Check services
kubectl get services -n kaizen-studio

# Check ingress
kubectl get ingress -n kaizen-studio

# Watch rollout
kubectl rollout status deployment/backend -n kaizen-studio
```

## Step 8: Access Application

Wait for TLS certificate to be issued (2-5 minutes):

```bash
kubectl get certificate -n kaizen-studio
```

Once ready:
```
https://YOUR_DOMAIN
```

## Troubleshooting

### Pods not starting?

```bash
kubectl describe pod POD_NAME -n kaizen-studio
kubectl logs POD_NAME -n kaizen-studio
```

### Database connection failed?

```bash
# Check PostgreSQL
kubectl logs -l app.kubernetes.io/component=postgres -n kaizen-studio

# Test connection
kubectl exec -it deploy/backend -n kaizen-studio -- env | grep DATABASE_URL
```

### Ingress not working?

```bash
# Check certificate
kubectl describe certificate kaizen-studio-tls -n kaizen-studio

# Check ingress controller
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

## Common Commands

```bash
# View all resources
kubectl get all -n kaizen-studio

# Stream logs
kubectl logs -f -l app.kubernetes.io/component=backend -n kaizen-studio

# Restart backend
kubectl rollout restart deployment/backend -n kaizen-studio

# Scale backend
kubectl scale deployment backend --replicas=5 -n kaizen-studio

# Port forward for testing
kubectl port-forward svc/backend-service 8000:8000 -n kaizen-studio
```

## Next Steps

- Review full documentation: `README.md`
- Configure monitoring: See monitoring section
- Set up backups: See maintenance operations
- Configure alerting: See monitoring.yaml

## Support

For detailed documentation, see `README.md`.
