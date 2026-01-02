#!/bin/bash
# ==============================================
# Rollback Kaizen Studio Deployment
# ==============================================
# Usage: ./rollback.sh <environment> [revision]
# Example: ./rollback.sh production
# Example: ./rollback.sh production 3

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 1 ]; then
    echo -e "${RED}Error: Missing environment argument${NC}"
    echo "Usage: $0 <environment> [revision]"
    echo "Example: $0 production"
    echo "Example: $0 production 3"
    exit 1
fi

ENVIRONMENT=$1
REVISION=${2:-""}

# Determine namespace
NAMESPACE="kaizen-studio"
if [ "$ENVIRONMENT" = "dev" ]; then
    NAMESPACE="kaizen-studio-dev"
elif [ "$ENVIRONMENT" = "staging" ]; then
    NAMESPACE="kaizen-studio-staging"
fi

echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}Rollback Kaizen Studio${NC}"
echo -e "${GREEN}Environment: $ENVIRONMENT${NC}"
echo -e "${GREEN}Namespace: $NAMESPACE${NC}"
echo -e "${GREEN}===============================================${NC}"
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

# Show current deployment status
echo -e "${BLUE}Current Deployment Status:${NC}"
echo ""
echo -e "${YELLOW}Backend:${NC}"
kubectl rollout history deployment/backend -n "$NAMESPACE"
echo ""
echo -e "${YELLOW}Frontend:${NC}"
kubectl rollout history deployment/web -n "$NAMESPACE"
echo ""
echo -e "${YELLOW}Redis:${NC}"
kubectl rollout history deployment/redis -n "$NAMESPACE"
echo ""

# Confirm rollback
if [ "$ENVIRONMENT" = "prod" ]; then
    echo -e "${RED}WARNING: You are rolling back PRODUCTION${NC}"
fi

if [ -n "$REVISION" ]; then
    read -p "Rollback to revision $REVISION? (yes/no): " CONFIRM
else
    read -p "Rollback to previous revision? (yes/no): " CONFIRM
fi

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}Rollback aborted${NC}"
    exit 0
fi
echo ""

# Perform rollback
echo -e "${GREEN}Rolling back deployments...${NC}"

if [ -n "$REVISION" ]; then
    echo -e "${YELLOW}Backend (to revision $REVISION):${NC}"
    kubectl rollout undo deployment/backend -n "$NAMESPACE" --to-revision="$REVISION"

    echo -e "${YELLOW}Frontend (to revision $REVISION):${NC}"
    kubectl rollout undo deployment/web -n "$NAMESPACE" --to-revision="$REVISION"

    echo -e "${YELLOW}Redis (to revision $REVISION):${NC}"
    kubectl rollout undo deployment/redis -n "$NAMESPACE" --to-revision="$REVISION"
else
    echo -e "${YELLOW}Backend (to previous revision):${NC}"
    kubectl rollout undo deployment/backend -n "$NAMESPACE"

    echo -e "${YELLOW}Frontend (to previous revision):${NC}"
    kubectl rollout undo deployment/web -n "$NAMESPACE"

    echo -e "${YELLOW}Redis (to previous revision):${NC}"
    kubectl rollout undo deployment/redis -n "$NAMESPACE"
fi
echo ""

# Wait for rollback to complete
echo -e "${BLUE}Waiting for rollback to complete...${NC}"
echo ""

echo -e "${YELLOW}Backend:${NC}"
kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=5m

echo -e "${YELLOW}Frontend:${NC}"
kubectl rollout status deployment/web -n "$NAMESPACE" --timeout=3m

echo -e "${YELLOW}Redis:${NC}"
kubectl rollout status deployment/redis -n "$NAMESPACE" --timeout=3m

echo ""
echo -e "${GREEN}✓ Rollback completed successfully${NC}"
echo ""

# Show current status
echo -e "${BLUE}Current Pod Status:${NC}"
kubectl get pods -n "$NAMESPACE"
echo ""

echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}Rollback Summary${NC}"
echo -e "${GREEN}===============================================${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Namespace: ${YELLOW}$NAMESPACE${NC}"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Verify application: kubectl get pods -n $NAMESPACE"
echo "2. Check logs: kubectl logs -f -l app.kubernetes.io/component=backend -n $NAMESPACE"
echo "3. Test health endpoint: kubectl port-forward svc/backend-service 8000:8000 -n $NAMESPACE"
echo ""
