#!/bin/bash
# ==============================================
# Generate Secure Secrets for Kaizen Studio
# ==============================================
# Usage: ./generate-secrets.sh <environment>
# Example: ./generate-secrets.sh production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -ne 1 ]; then
    echo -e "${RED}Error: Missing environment argument${NC}"
    echo "Usage: $0 <environment>"
    echo "Example: $0 production"
    exit 1
fi

ENVIRONMENT=$1
NAMESPACE="kaizen-studio"

# Adjust namespace based on environment
if [ "$ENVIRONMENT" = "dev" ]; then
    NAMESPACE="kaizen-studio-dev"
elif [ "$ENVIRONMENT" = "staging" ]; then
    NAMESPACE="kaizen-studio-staging"
fi

echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}Generating Secrets for Kaizen Studio${NC}"
echo -e "${GREEN}Environment: $ENVIRONMENT${NC}"
echo -e "${GREEN}Namespace: $NAMESPACE${NC}"
echo -e "${GREEN}===============================================${NC}"
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

# Check if openssl is installed
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}Error: openssl is not installed${NC}"
    exit 1
fi

# Generate secrets
echo -e "${YELLOW}Generating secure random secrets...${NC}"
POSTGRES_USER="kaizen_user_$(openssl rand -hex 4)"
POSTGRES_PASSWORD=$(openssl rand -hex 32)
POSTGRES_DB="kaizen_studio_${ENVIRONMENT}"
REDIS_PASSWORD=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Construct connection URLs
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres-service:5432/${POSTGRES_DB}"
REDIS_URL="redis://:${REDIS_PASSWORD}@redis-service:6379"

echo -e "${GREEN}Secrets generated successfully!${NC}"
echo ""

# Prompt for Azure AD credentials (optional)
echo -e "${YELLOW}Azure AD SSO Configuration (optional):${NC}"
read -p "Enter Azure Client ID (press Enter to skip): " AZURE_CLIENT_ID
if [ -n "$AZURE_CLIENT_ID" ]; then
    read -sp "Enter Azure Client Secret: " AZURE_CLIENT_SECRET
    echo ""
else
    AZURE_CLIENT_ID=""
    AZURE_CLIENT_SECRET=""
fi
echo ""

# Check if namespace exists
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    echo -e "${YELLOW}Namespace $NAMESPACE does not exist. Creating...${NC}"
    kubectl create namespace "$NAMESPACE"
    echo -e "${GREEN}Namespace created successfully!${NC}"
    echo ""
fi

# Check if secret already exists
if kubectl get secret kaizen-studio-secrets -n "$NAMESPACE" &> /dev/null; then
    echo -e "${YELLOW}Warning: Secret 'kaizen-studio-secrets' already exists in namespace $NAMESPACE${NC}"
    read -p "Do you want to replace it? (yes/no): " REPLACE
    if [ "$REPLACE" != "yes" ]; then
        echo -e "${RED}Aborted. Secret not created.${NC}"
        exit 0
    fi
    kubectl delete secret kaizen-studio-secrets -n "$NAMESPACE"
    echo -e "${GREEN}Existing secret deleted.${NC}"
fi

# Create Kubernetes secret
echo -e "${YELLOW}Creating Kubernetes secret...${NC}"
kubectl create secret generic kaizen-studio-secrets \
    --from-literal=postgres-user="$POSTGRES_USER" \
    --from-literal=postgres-password="$POSTGRES_PASSWORD" \
    --from-literal=postgres-db="$POSTGRES_DB" \
    --from-literal=redis-password="$REDIS_PASSWORD" \
    --from-literal=jwt-secret="$JWT_SECRET" \
    --from-literal=encryption-key="$ENCRYPTION_KEY" \
    --from-literal=azure-client-id="$AZURE_CLIENT_ID" \
    --from-literal=azure-client-secret="$AZURE_CLIENT_SECRET" \
    --from-literal=database-url="$DATABASE_URL" \
    --from-literal=redis-url="$REDIS_URL" \
    --namespace="$NAMESPACE"

echo -e "${GREEN}Secret created successfully!${NC}"
echo ""

# Save credentials to file (optional)
echo -e "${YELLOW}Saving credentials to .secrets-${ENVIRONMENT}.env (for backup only)${NC}"
cat > ".secrets-${ENVIRONMENT}.env" <<EOF
# Kaizen Studio Secrets - $ENVIRONMENT
# Generated: $(date)
# IMPORTANT: Store securely and DO NOT commit to version control

POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=$POSTGRES_DB
REDIS_PASSWORD=$REDIS_PASSWORD
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
DATABASE_URL=$DATABASE_URL
REDIS_URL=$REDIS_URL
EOF

if [ -n "$AZURE_CLIENT_ID" ]; then
    cat >> ".secrets-${ENVIRONMENT}.env" <<EOF
AZURE_CLIENT_ID=$AZURE_CLIENT_ID
AZURE_CLIENT_SECRET=$AZURE_CLIENT_SECRET
EOF
fi

chmod 600 ".secrets-${ENVIRONMENT}.env"
echo -e "${GREEN}Credentials saved to .secrets-${ENVIRONMENT}.env${NC}"
echo ""

# Summary
echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}Summary${NC}"
echo -e "${GREEN}===============================================${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Namespace: ${YELLOW}$NAMESPACE${NC}"
echo -e "Secret Name: ${YELLOW}kaizen-studio-secrets${NC}"
echo -e "Backup File: ${YELLOW}.secrets-${ENVIRONMENT}.env${NC}"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Verify secret: kubectl get secret kaizen-studio-secrets -n $NAMESPACE"
echo "2. Deploy application: kubectl apply -k deploy/k8s/overlays/$ENVIRONMENT"
echo "3. Store backup file securely and delete from disk"
echo ""
echo -e "${YELLOW}IMPORTANT: Add .secrets-*.env to .gitignore${NC}"
echo ""
