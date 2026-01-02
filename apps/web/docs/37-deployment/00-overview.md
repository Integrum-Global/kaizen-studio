# Deployment Guide

## Overview

This guide covers deployment options for the Kaizen Studio frontend, including Docker, static hosting, and Kubernetes configurations.

## Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Type check
npm run type-check

# Run tests
npm test
```

## Environment Configuration

### Environment Files

| File | Purpose |
|------|---------|
| `.env.example` | Template with all variables documented |
| `.env.local` | Local development overrides (gitignored) |
| `.env.production` | Production defaults |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |
| `VITE_API_VERSION` | API version prefix | `v1` |
| `VITE_WS_URL` | WebSocket URL | `ws://localhost:8000` |
| `VITE_DEBUG` | Enable debug logging | `false` |
| `VITE_ENABLE_MOCKS` | Enable MSW mocking | `false` |

### SSO Configuration

```bash
# Azure AD
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-client-id

# Okta
VITE_OKTA_CLIENT_ID=your-client-id
VITE_OKTA_ISSUER=https://your-domain.okta.com
```

## Docker Deployment

### Build Image

```bash
# Build production image
docker build -t kaizen-studio-frontend:latest .

# Build with specific tag
docker build -t kaizen-studio-frontend:v1.0.0 .
```

### Run Container

```bash
# Run standalone
docker run -d \
  -p 3000:80 \
  --name kaizen-frontend \
  kaizen-studio-frontend:latest

# Run with custom API URL
docker run -d \
  -p 3000:80 \
  -e VITE_API_URL=https://api.example.com \
  --name kaizen-frontend \
  kaizen-studio-frontend:latest
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f frontend

# Stop services
docker-compose down
```

## Nginx Configuration

The production image uses Nginx with:

- **Gzip compression** for all text assets
- **Cache headers** for static assets (1 year for immutable files)
- **Security headers** (CSP, X-Frame-Options, etc.)
- **SPA routing** (fallback to index.html)
- **API proxy** to backend service
- **WebSocket proxy** for real-time updates

### Custom Nginx Config

Mount a custom config:

```bash
docker run -d \
  -p 3000:80 \
  -v /path/to/custom.conf:/etc/nginx/conf.d/default.conf:ro \
  kaizen-studio-frontend:latest
```

## Static Hosting

### Build for Static Hosting

```bash
# Generate optimized static files
npm run build

# Output in ./dist directory
```

### Hosting Platforms

**Vercel**:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Netlify**:
```bash
# Build command: npm run build
# Publish directory: dist
# Add _redirects file for SPA:
echo "/* /index.html 200" > dist/_redirects
```

**AWS S3 + CloudFront**:
```bash
# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

## Kubernetes Deployment

### Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kaizen-frontend
  labels:
    app: kaizen-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kaizen-frontend
  template:
    metadata:
      labels:
        app: kaizen-frontend
    spec:
      containers:
      - name: frontend
        image: kaizen-studio-frontend:latest
        ports:
        - containerPort: 80
        resources:
          limits:
            cpu: "500m"
            memory: "256Mi"
          requests:
            cpu: "100m"
            memory: "128Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 3
          periodSeconds: 5
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: kaizen-frontend
spec:
  selector:
    app: kaizen-frontend
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

### Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: kaizen-frontend
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  rules:
  - host: kaizen-studio.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: kaizen-frontend
            port:
              number: 80
  tls:
  - hosts:
    - kaizen-studio.example.com
    secretName: kaizen-tls
```

## Performance Optimization

### Build Output

Production build generates optimized chunks:

| Chunk | Contents | Approximate Size |
|-------|----------|------------------|
| `react` | React, ReactDOM | ~45 KB gzipped |
| `router` | React Router | ~15 KB gzipped |
| `query` | React Query | ~12 KB gzipped |
| `reactflow` | React Flow | ~40 KB gzipped |
| `main` | Application code | ~50-100 KB gzipped |

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP | < 3 seconds | Largest Contentful Paint |
| INP | < 100ms | Interaction to Next Paint |
| FCP | < 1.5 seconds | First Contentful Paint |
| TTI | < 4 seconds | Time to Interactive |

### Optimization Checklist

- [x] Code splitting with React.lazy
- [x] Lazy loading for all routes
- [x] Manual chunks for vendor libraries
- [x] Tree shaking enabled
- [x] Minification with terser
- [x] Gzip compression in Nginx
- [ ] Image optimization (add as needed)
- [ ] Service worker for caching (optional)

## Health Checks

### Frontend Health

```bash
curl http://localhost:3000/health
# Returns: OK
```

### API Connectivity

```bash
curl http://localhost:3000/api/v1/health
# Proxies to backend health endpoint
```

## Troubleshooting

### Common Issues

**Blank page after deploy**:
- Check browser console for errors
- Verify base URL is correct
- Ensure nginx.conf has SPA fallback

**API calls failing**:
- Check VITE_API_URL environment variable
- Verify API proxy in nginx.conf
- Check CORS headers on backend

**WebSocket not connecting**:
- Verify VITE_WS_URL environment variable
- Check nginx WebSocket proxy configuration
- Ensure backend WebSocket endpoint is accessible

**Slow initial load**:
- Enable gzip compression
- Verify code splitting is working
- Check network tab for large bundles
- Consider CDN for static assets

### Logs

```bash
# Docker logs
docker logs kaizen-frontend

# Kubernetes logs
kubectl logs -l app=kaizen-frontend

# Nginx access logs (inside container)
docker exec kaizen-frontend tail -f /var/log/nginx/access.log
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Run tests
        run: npm test -- --run

      - name: Build
        run: npm run build

      - name: Build Docker image
        run: docker build -t kaizen-frontend:${{ github.sha }} .

      - name: Push to registry
        run: |
          docker tag kaizen-frontend:${{ github.sha }} registry.example.com/kaizen-frontend:${{ github.sha }}
          docker push registry.example.com/kaizen-frontend:${{ github.sha }}
```
