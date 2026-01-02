#!/bin/bash
# ==============================================
# Deploy Kaizen Studio to Kubernetes
# ==============================================
# Usage: ./deploy.sh <environment>
# Example: ./deploy.sh production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -ne 1 ]; then
    echo -e "${RED}Error: Missing environment argument${NC}"
    echo "Usage: $0 <environment>"
    echo "Example: $0 production"
    echo ""
    echo "Available environments: dev, staging, prod"
    exit 1
fi

ENVIRONMENT=$1
OVERLAY_PATH="../overlays/${ENVIRONMENT}"

# Validate environment
if [ ! -d "$OVERLAY_PATH" ]; then
    echo -e "${RED}Error: Invalid environment '$ENVIRONMENT'${NC}"
    echo "Available environments: dev, staging, prod"
    exit 1
fi

echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}Deploying Kaizen Studio${NC}"
echo -e "${GREEN}Environment: $ENVIRONMENT${NC}"
echo -e "${GREEN}===============================================${NC}"
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

# Check if kustomize is installed
if ! command -v kustomize &> /dev/null; then
    echo -e "${YELLOW}Warning: kustomize is not installed${NC}"
    echo -e "${YELLOW}Using kubectl kustomize instead (may have version differences)${NC}"
    echo ""
fi

# Determine namespace
NAMESPACE="kaizen-studio"
if [ "$ENVIRONMENT" = "dev" ]; then
    NAMESPACE="kaizen-studio-dev"
elif [ "$ENVIRONMENT" = "staging" ]; then
    NAMESPACE="kaizen-studio-staging"
fi

# Pre-deployment checks
echo -e "${BLUE}Running pre-deployment checks...${NC}"

# Check if secrets exist
if ! kubectl get secret kaizen-studio-secrets -n "$NAMESPACE" &> /dev/null 2>&1; then
    echo -e "${RED}Error: Secrets not found in namespace $NAMESPACE${NC}"
    echo -e "${YELLOW}Run ./generate-secrets.sh $ENVIRONMENT first${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Secrets found${NC}"

# Check if namespace exists
if ! kubectl get namespace "$NAMESPACE" &> /dev/null 2>&1; then
    echo -e "${YELLOW}Creating namespace $NAMESPACE...${NC}"
    kubectl create namespace "$NAMESPACE"
    echo -e "${GREEN}✓ Namespace created${NC}"
else
    echo -e "${GREEN}✓ Namespace exists${NC}"
fi

echo ""

# Dry run to validate manifests
echo -e "${BLUE}Validating manifests (dry-run)...${NC}"
if command -v kustomize &> /dev/null; then
    kustomize build "$OVERLAY_PATH" | kubectl apply --dry-run=client -f - > /dev/null
else
    kubectl apply -k "$OVERLAY_PATH" --dry-run=client > /dev/null
fi
echo -e "${GREEN}✓ Manifests validated successfully${NC}"
echo ""

# Confirm deployment
if [ "$ENVIRONMENT" = "prod" ]; then
    echo -e "${RED}WARNING: You are deploying to PRODUCTION${NC}"
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo -e "${RED}Deployment aborted${NC}"
        exit 0
    fi
else
    read -p "Deploy to $ENVIRONMENT? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo -e "${RED}Deployment aborted${NC}"
        exit 0
    fi
fi
echo ""

# Deploy
echo -e "${GREEN}Deploying to Kubernetes...${NC}"
if command -v kustomize &> /dev/null; then
    kustomize build "$OVERLAY_PATH" | kubectl apply -f -
else
    kubectl apply -k "$OVERLAY_PATH"
fi
echo -e "${GREEN}✓ Deployment completed${NC}"
echo ""

# Wait for rollout
echo -e "${BLUE}Waiting for rollout to complete...${NC}"
echo ""

echo -e "${YELLOW}PostgreSQL StatefulSet:${NC}"
kubectl rollout status statefulset/postgres -n "$NAMESPACE" --timeout=5m

echo -e "${YELLOW}Redis Deployment:${NC}"
kubectl rollout status deployment/redis -n "$NAMESPACE" --timeout=3m

echo -e "${YELLOW}Backend Deployment:${NC}"
kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=5m

echo -e "${YELLOW}Frontend Deployment:${NC}"
kubectl rollout status deployment/web -n "$NAMESPACE" --timeout=3m

echo ""
echo -e "${GREEN}✓ All deployments rolled out successfully${NC}"
echo ""

# Post-deployment verification
echo -e "${BLUE}Running post-deployment verification...${NC}"
echo ""

# Check pod status
echo -e "${YELLOW}Pod Status:${NC}"
kubectl get pods -n "$NAMESPACE"
echo ""

# Check service status
echo -e "${YELLOW}Service Status:${NC}"
kubectl get services -n "$NAMESPACE"
echo ""

# Check ingress status
echo -e "${YELLOW}Ingress Status:${NC}"
kubectl get ingress -n "$NAMESPACE"
echo ""

# Get ingress URL
INGRESS_HOST=$(kubectl get ingress kaizen-studio-ingress -n "$NAMESPACE" -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "Not configured")
echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}Deployment Summary${NC}"
echo -e "${GREEN}===============================================${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Namespace: ${YELLOW}$NAMESPACE${NC}"
echo -e "Ingress URL: ${YELLOW}https://$INGRESS_HOST${NC}"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Monitor logs: kubectl logs -f -l app.kubernetes.io/component=backend -n $NAMESPACE"
echo "2. Check health: curl https://$INGRESS_HOST/health"
echo "3. View pods: kubectl get pods -n $NAMESPACE"
echo "4. Port forward (testing): kubectl port-forward svc/backend-service 8000:8000 -n $NAMESPACE"
echo ""
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
