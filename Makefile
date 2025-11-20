.PHONY: help build push deploy undeploy logs status clean docker-build docker-run

# Variables
IMAGE_NAME ?= stitch-lms
IMAGE_TAG ?= latest
REGISTRY ?= 
NAMESPACE ?= lms

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

docker-build: ## Build Docker image
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .
	@echo "✅ Image built: $(IMAGE_NAME):$(IMAGE_TAG)"

docker-run: ## Run Docker container locally
	docker-compose up -d
	@echo "✅ Application running. Access at http://localhost:5173"

docker-stop: ## Stop Docker containers
	docker-compose down
	@echo "✅ Containers stopped"

docker-logs: ## View Docker logs
	docker-compose logs -f app

build: docker-build ## Alias for docker-build

push: ## Push image to registry (requires REGISTRY variable)
ifndef REGISTRY
	@echo "❌ REGISTRY variable not set. Usage: make push REGISTRY=your-registry.com"
	exit 1
endif
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)
	docker push $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)
	@echo "✅ Image pushed to $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)"

deploy: ## Deploy to Kubernetes
	@echo "🚀 Deploying to Kubernetes..."
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/secret.yaml
	kubectl apply -f k8s/configmap.yaml
	kubectl apply -f k8s/postgres-deployment.yaml
	@echo "⏳ Waiting for PostgreSQL..."
	kubectl wait --for=condition=ready pod -l app=postgres -n $(NAMESPACE) --timeout=300s || true
	kubectl apply -f k8s/app-deployment.yaml
	kubectl apply -f k8s/ingress.yaml
	kubectl apply -f k8s/hpa.yaml
	@echo "✅ Deployment complete!"

undeploy: ## Remove all Kubernetes resources
	@echo "🗑️  Removing Kubernetes resources..."
	kubectl delete -f k8s/ingress.yaml || true
	kubectl delete -f k8s/hpa.yaml || true
	kubectl delete -f k8s/app-deployment.yaml || true
	kubectl delete -f k8s/postgres-deployment.yaml || true
	kubectl delete -f k8s/configmap.yaml || true
	kubectl delete -f k8s/secret.yaml || true
	kubectl delete -f k8s/namespace.yaml || true
	@echo "✅ Resources removed"

status: ## Show deployment status
	@echo "📊 Deployment Status:"
	@echo ""
	@echo "Pods:"
	@kubectl get pods -n $(NAMESPACE) || echo "Namespace not found"
	@echo ""
	@echo "Services:"
	@kubectl get services -n $(NAMESPACE) || echo "Namespace not found"
	@echo ""
	@echo "Ingress:"
	@kubectl get ingress -n $(NAMESPACE) || echo "No ingress found"

logs: ## View application logs
	kubectl logs -f deployment/lms-app -n $(NAMESPACE)

logs-db: ## View database logs
	kubectl logs -f deployment/postgres -n $(NAMESPACE)

port-forward: ## Port forward to access app locally
	kubectl port-forward service/lms-service 5173:80 -n $(NAMESPACE)

port-forward-db: ## Port forward to access database locally
	kubectl port-forward service/postgres-service 5432:5432 -n $(NAMESPACE)

clean: ## Clean up Docker resources
	docker-compose down -v
	docker rmi $(IMAGE_NAME):$(IMAGE_TAG) || true
	@echo "✅ Cleanup complete"

test: ## Run health check
	@echo "🏥 Health Check:"
	@curl -s http://localhost:5173/health | jq . || echo "Service not available"

