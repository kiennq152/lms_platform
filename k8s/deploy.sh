#!/bin/bash

# Deployment script for Stitch LMS on Kubernetes
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying Stitch LMS to Kubernetes${NC}\n"

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Docker is installed (for building image)
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker is not installed. You'll need to build the image separately.${NC}"
fi

# Set namespace
NAMESPACE="lms"
IMAGE_NAME="${IMAGE_NAME:-stitch-lms}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo -e "${GREEN}📦 Building Docker image...${NC}"
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

# If you're using a registry, push the image
if [ ! -z "$REGISTRY" ]; then
    echo -e "${GREEN}📤 Pushing image to registry...${NC}"
    docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
    docker push ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
    IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}"
fi

echo -e "${GREEN}📝 Creating namespace...${NC}"
kubectl apply -f k8s/namespace.yaml

echo -e "${GREEN}🔐 Creating secrets...${NC}"
echo -e "${YELLOW}⚠️  Make sure to update k8s/secret.yaml with your actual secrets!${NC}"
kubectl apply -f k8s/secret.yaml

echo -e "${GREEN}⚙️  Creating ConfigMap...${NC}"
kubectl apply -f k8s/configmap.yaml

echo -e "${GREEN}🗄️  Deploying PostgreSQL...${NC}"
kubectl apply -f k8s/postgres-deployment.yaml

echo -e "${GREEN}⏳ Waiting for PostgreSQL to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=postgres -n ${NAMESPACE} --timeout=300s

echo -e "${GREEN}🚀 Deploying LMS application...${NC}"
# Update image in deployment if using registry
if [ ! -z "$REGISTRY" ]; then
    sed "s|image: stitch-lms:latest|image: ${IMAGE_NAME}:${IMAGE_TAG}|g" k8s/app-deployment.yaml | kubectl apply -f -
else
    kubectl apply -f k8s/app-deployment.yaml
fi

echo -e "${GREEN}🌐 Creating Ingress (if configured)...${NC}"
kubectl apply -f k8s/ingress.yaml

echo -e "${GREEN}📊 Creating HPA...${NC}"
kubectl apply -f k8s/hpa.yaml

echo -e "${GREEN}✅ Deployment complete!${NC}\n"

echo -e "${YELLOW}📋 Useful commands:${NC}"
echo "  kubectl get pods -n ${NAMESPACE}"
echo "  kubectl get services -n ${NAMESPACE}"
echo "  kubectl logs -f deployment/lms-app -n ${NAMESPACE}"
echo "  kubectl port-forward service/lms-service 5173:80 -n ${NAMESPACE}"

