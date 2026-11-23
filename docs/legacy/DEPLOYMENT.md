# 🚀 Docker & Kubernetes Deployment Guide

Complete guide for deploying Stitch LMS with Docker and Kubernetes.

## 📦 Quick Reference

### Docker (Local Development)

```bash
# Build and run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down

# Clean everything
docker-compose down -v
```

### Kubernetes (Production)

```bash
# Quick deploy
make deploy

# Or use the script
chmod +x k8s/deploy.sh
./k8s/deploy.sh

# Check status
make status

# View logs
make logs

# Port forward for local access
make port-forward
```

## 🔧 Setup Steps

### 1. Configure Secrets

**Before deploying, update `k8s/secret.yaml`:**

```yaml
stringData:
  DB_USER: "postgres"
  DB_PASSWORD: "your-secure-password"  # ⚠️ CHANGE THIS!
```

Or create via CLI:

```bash
kubectl create secret generic lms-secrets \
  --from-literal=DB_USER=postgres \
  --from-literal=DB_PASSWORD=your-password \
  --namespace=lms
```

### 2. Build Docker Image

```bash
# Local build
docker build -t stitch-lms:latest .

# With registry
docker build -t your-registry.com/stitch-lms:1.0.0 .
docker push your-registry.com/stitch-lms:1.0.0
```

### 3. Deploy to Kubernetes

```bash
# Option A: Using Make
make deploy

# Option B: Using script
./k8s/deploy.sh

# Option C: Manual
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl wait --for=condition=ready pod -l app=postgres -n lms
kubectl apply -f k8s/app-deployment.yaml
```

## 📋 File Structure

```
.
├── Dockerfile                 # Docker image definition
├── .dockerignore             # Files to exclude from Docker build
├── docker-compose.yml        # Local development setup
├── Makefile                  # Common commands
├── k8s/
│   ├── namespace.yaml        # K8s namespace
│   ├── configmap.yaml        # Non-sensitive config
│   ├── secret.yaml          # Sensitive data (UPDATE THIS!)
│   ├── postgres-deployment.yaml  # Database deployment
│   ├── app-deployment.yaml  # Application deployment
│   ├── ingress.yaml         # External access (optional)
│   ├── hpa.yaml            # Auto-scaling (optional)
│   ├── kustomization.yaml   # Kustomize config
│   ├── deploy.sh           # Deployment script
│   └── README.md           # Detailed K8s guide
└── DEPLOYMENT.md           # This file
```

## 🎯 Common Commands

### Docker

| Command | Description |
|---------|-------------|
| `make docker-build` | Build Docker image |
| `make docker-run` | Start with docker-compose |
| `make docker-stop` | Stop containers |
| `make docker-logs` | View logs |

### Kubernetes

| Command | Description |
|---------|-------------|
| `make deploy` | Deploy everything |
| `make undeploy` | Remove everything |
| `make status` | Show deployment status |
| `make logs` | View app logs |
| `make logs-db` | View database logs |
| `make port-forward` | Access app locally (port 5173) |
| `make port-forward-db` | Access DB locally (port 5432) |

## 🔍 Verification

### Check if everything is running:

```bash
# Kubernetes
kubectl get all -n lms

# Docker
docker-compose ps
```

### Test the application:

```bash
# Health check
curl http://localhost:5173/health

# Or via port-forward
kubectl port-forward service/lms-service 5173:80 -n lms
curl http://localhost:5173/health
```

## 🐛 Troubleshooting

### Issue: Pods not starting

```bash
# Check pod status
kubectl get pods -n lms

# Describe pod for events
kubectl describe pod <pod-name> -n lms

# Check logs
kubectl logs <pod-name> -n lms
```

### Issue: Database connection failed

```bash
# Verify database is running
kubectl get pods -l app=postgres -n lms

# Check database logs
kubectl logs -l app=postgres -n lms

# Test connection
kubectl exec -it deployment/postgres -n lms -- \
  psql -U postgres -d lms_db -c "SELECT 1;"
```

### Issue: Image pull errors

```bash
# For local images, set imagePullPolicy to IfNotPresent
# In k8s/app-deployment.yaml:
# imagePullPolicy: IfNotPresent

# Or load image into cluster (minikube/kind)
minikube image load stitch-lms:latest
# or
kind load docker-image stitch-lms:latest
```

## 🌍 Production Checklist

- [ ] Update all secrets in `k8s/secret.yaml`
- [ ] Configure proper domain in `k8s/ingress.yaml`
- [ ] Set up TLS/SSL certificates
- [ ] Configure image registry and update image references
- [ ] Set up database backups
- [ ] Configure monitoring (Prometheus/Grafana)
- [ ] Set up logging (ELK/Loki)
- [ ] Review resource limits
- [ ] Set up CI/CD pipeline
- [ ] Configure network policies
- [ ] Review security contexts

## 📚 More Information

- Detailed K8s guide: `k8s/README.md`
- Docker Compose: `docker-compose.yml`
- All K8s manifests: `k8s/*.yaml`

## 🆘 Need Help?

1. Check logs: `make logs` or `kubectl logs -f deployment/lms-app -n lms`
2. Check events: `kubectl get events -n lms --sort-by='.lastTimestamp'`
3. Describe resources: `kubectl describe <resource> <name> -n lms`

