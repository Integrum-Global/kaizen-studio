#!/bin/bash
# ==============================================
# Validate Kubernetes Manifests
# ==============================================
# Usage: ./validate.sh <environment>
# Example: ./validate.sh production

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
echo -e "${GREEN}Validating Kaizen Studio Manifests${NC}"
echo -e "${GREEN}Environment: $ENVIRONMENT${NC}"
echo -e "${GREEN}===============================================${NC}"
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

# Check if kustomize is installed
USE_KUSTOMIZE=false
if command -v kustomize &> /dev/null; then
    USE_KUSTOMIZE=true
    echo -e "${GREEN}✓ Using kustomize CLI${NC}"
else
    echo -e "${YELLOW}⚠ Using kubectl kustomize (may have version differences)${NC}"
fi
echo ""

# Validation checks
ERRORS=0
WARNINGS=0

echo -e "${BLUE}Running validation checks...${NC}"
echo ""

# 1. Check if base manifests exist
echo -e "${YELLOW}1. Checking base manifests...${NC}"
BASE_FILES=(
    "../base/namespace.yaml"
    "../base/configmap.yaml"
    "../base/secrets.yaml"
    "../base/backend.yaml"
    "../base/web.yaml"
    "../base/postgresql.yaml"
    "../base/redis.yaml"
    "../base/ingress.yaml"
    "../base/kustomization.yaml"
)

for file in "${BASE_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ Missing base file: $file${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓ Found: $file${NC}"
    fi
done
echo ""

# 2. Check if overlay files exist
echo -e "${YELLOW}2. Checking overlay files...${NC}"
if [ ! -f "$OVERLAY_PATH/kustomization.yaml" ]; then
    echo -e "${RED}✗ Missing kustomization.yaml in $OVERLAY_PATH${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✓ Found: $OVERLAY_PATH/kustomization.yaml${NC}"
fi
echo ""

# 3. Validate YAML syntax
echo -e "${YELLOW}3. Validating YAML syntax...${NC}"
if $USE_KUSTOMIZE; then
    if kustomize build "$OVERLAY_PATH" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ YAML syntax is valid${NC}"
    else
        echo -e "${RED}✗ YAML syntax error detected${NC}"
        kustomize build "$OVERLAY_PATH" 2>&1 | tail -20
        ((ERRORS++))
    fi
else
    if kubectl kustomize "$OVERLAY_PATH" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ YAML syntax is valid${NC}"
    else
        echo -e "${RED}✗ YAML syntax error detected${NC}"
        kubectl kustomize "$OVERLAY_PATH" 2>&1 | tail -20
        ((ERRORS++))
    fi
fi
echo ""

# 4. Validate Kubernetes resource definitions
echo -e "${YELLOW}4. Validating Kubernetes resources (dry-run)...${NC}"
if $USE_KUSTOMIZE; then
    if kustomize build "$OVERLAY_PATH" | kubectl apply --dry-run=client -f - > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Kubernetes resources are valid${NC}"
    else
        echo -e "${RED}✗ Kubernetes validation failed${NC}"
        kustomize build "$OVERLAY_PATH" | kubectl apply --dry-run=client -f - 2>&1 | grep -i "error" | head -10
        ((ERRORS++))
    fi
else
    if kubectl apply -k "$OVERLAY_PATH" --dry-run=client > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Kubernetes resources are valid${NC}"
    else
        echo -e "${RED}✗ Kubernetes validation failed${NC}"
        kubectl apply -k "$OVERLAY_PATH" --dry-run=client 2>&1 | grep -i "error" | head -10
        ((ERRORS++))
    fi
fi
echo ""

# 5. Check for required secrets (if deploying to real cluster)
if kubectl cluster-info &> /dev/null; then
    echo -e "${YELLOW}5. Checking for required secrets in cluster...${NC}"
    NAMESPACE="kaizen-studio"
    if [ "$ENVIRONMENT" = "dev" ]; then
        NAMESPACE="kaizen-studio-dev"
    elif [ "$ENVIRONMENT" = "staging" ]; then
        NAMESPACE="kaizen-studio-staging"
    fi

    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        if kubectl get secret kaizen-studio-secrets -n "$NAMESPACE" &> /dev/null; then
            echo -e "${GREEN}✓ Secrets found in namespace $NAMESPACE${NC}"
        else
            echo -e "${YELLOW}⚠ Secrets not found in namespace $NAMESPACE${NC}"
            echo -e "${YELLOW}  Run: ./generate-secrets.sh $ENVIRONMENT${NC}"
            ((WARNINGS++))
        fi
    else
        echo -e "${YELLOW}⚠ Namespace $NAMESPACE does not exist (will be created on deployment)${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}5. Skipping cluster checks (no cluster connection)${NC}"
fi
echo ""

# 6. Check for common configuration issues
echo -e "${YELLOW}6. Checking configuration...${NC}"

# Check if domain is configured
if grep -q "yourdomain.com" "../base/ingress.yaml"; then
    echo -e "${YELLOW}⚠ Ingress domain still set to 'yourdomain.com'${NC}"
    echo -e "${YELLOW}  Update domain in: deploy/k8s/base/ingress.yaml${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓ Ingress domain configured${NC}"
fi

# Check if email is configured
if grep -q "admin@yourdomain.com" "../base/ingress.yaml"; then
    echo -e "${YELLOW}⚠ cert-manager email still set to 'admin@yourdomain.com'${NC}"
    echo -e "${YELLOW}  Update email in: deploy/k8s/base/ingress.yaml${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓ cert-manager email configured${NC}"
fi

# Check if image references are updated
if grep -q "kaizen-studio/backend:latest" "$OVERLAY_PATH/kustomization.yaml" 2>/dev/null; then
    echo -e "${YELLOW}⚠ Backend image still using 'latest' tag${NC}"
    echo -e "${YELLOW}  Update image in: $OVERLAY_PATH/kustomization.yaml${NC}"
    ((WARNINGS++))
fi

if grep -q "kaizen-studio/web:latest" "$OVERLAY_PATH/kustomization.yaml" 2>/dev/null; then
    echo -e "${YELLOW}⚠ Frontend image still using 'latest' tag${NC}"
    echo -e "${YELLOW}  Update image in: $OVERLAY_PATH/kustomization.yaml${NC}"
    ((WARNINGS++))
fi

echo ""

# 7. Check resource limits
echo -e "${YELLOW}7. Analyzing resource requirements...${NC}"
if $USE_KUSTOMIZE; then
    TOTAL_CPU_REQUESTS=$(kustomize build "$OVERLAY_PATH" | grep -A 3 "requests:" | grep "cpu:" | awk '{print $2}' | sed 's/m$//' | awk '{sum+=$1} END {print sum}')
    TOTAL_MEM_REQUESTS=$(kustomize build "$OVERLAY_PATH" | grep -A 3 "requests:" | grep "memory:" | awk '{print $2}' | sed 's/Gi$//' | awk '{sum+=$1} END {print sum}')

    echo -e "  Total CPU requests: ${TOTAL_CPU_REQUESTS:-N/A}m"
    echo -e "  Total Memory requests: ${TOTAL_MEM_REQUESTS:-N/A}Gi"
else
    echo -e "  Install kustomize for detailed resource analysis"
fi
echo ""

# Summary
echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}Validation Summary${NC}"
echo -e "${GREEN}===============================================${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Errors: ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}✗ Validation failed with $ERRORS error(s)${NC}"
    echo -e "${RED}Fix errors before deployment${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Validation passed with $WARNINGS warning(s)${NC}"
    echo -e "${YELLOW}Review warnings before production deployment${NC}"
    exit 0
else
    echo -e "${GREEN}✓ Validation passed with no errors or warnings${NC}"
    echo -e "${GREEN}Ready for deployment!${NC}"
    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo "1. Generate secrets: ./generate-secrets.sh $ENVIRONMENT"
    echo "2. Deploy: ./deploy.sh $ENVIRONMENT"
    exit 0
fi
