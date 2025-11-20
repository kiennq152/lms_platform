# Kubernetes Deployment Guide for Stitch LMS

This guide will help you deploy the Stitch LMS application to Kubernetes.

## 📋 Prerequisites

1. **Kubernetes Cluster** (minikube, kind, GKE, EKS, AKS, or any K8s cluster)
2. **kubectl** configured to access your cluster
3. **Docker** for building images
4. **PostgreSQL** (deployed via K8s or external)

## 🚀 Quick Start

### Option 1: Using Make (Recommended)

```bash
# Build Docker image
make docker-build

# Deploy to Kubernetes
make deploy

# Check status
make status

# View logs
make logs
```

### Option 2: Manual Deployment

```bash
# 1. Build Docker image
docker build -t stitch-lms:latest .

# 2. Create namespace
kubectl apply -f k8s/namespace.yaml

# 3. Update secrets (IMPORTANT!)
# Edit k8s/secret.yaml with your actual database credentials
kubectl apply -f k8s/secret.yaml

# 4. Create ConfigMap
kubectl apply -f k8s/configmap.yaml

# 5. Deploy PostgreSQL
kubectl apply -f k8s/postgres-deployment.yaml

# 6. Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n lms --timeout=300s

# 7. Deploy application
kubectl apply -f k8s/app-deployment.yaml

# 8. Deploy Ingress (optional)
kubectl apply -f k8s/ingress.yaml

# 9. Deploy HPA (optional)
kubectl apply -f k8s/hpa.yaml
```

## ⚙️ Configuration

### 1. Update Secrets

**IMPORTANT:** Before deploying, update `k8s/secret.yaml` with your actual credentials:

```yaml
stringData:
  DB_USER: "postgres"
  DB_PASSWORD: "your-secure-password-here"
```

Or create secrets via command line:

```bash
kubectl create secret generic lms-secrets \
  --from-literal=DB_USER=postgres \
  --from-literal=DB_PASSWORD=your-password \
  --namespace=lms
```

### 2. Update ConfigMap

Edit `k8s/configmap.yaml` to match your environment:

```yaml
data:
  NODE_ENV: "production"
  PORT: "5173"
  DB_HOST: "postgres-service"
  DB_PORT: "5432"
  DB_NAME: "lms_db"
  CORS_ORIGIN: "*"
```

### 3. Update Image Reference

If using a container registry, update `k8s/app-deployment.yaml`:

```yaml
image: your-registry.com/stitch-lms:1.0.0
```

Or use Kustomize:

```bash
kubectl apply -k k8s/
```

### 4. Configure Ingress

Edit `k8s/ingress.yaml` to set your domain:

```yaml
rules:
- host: lms.yourdomain.com  # Change this
```

## 📦 Using Container Registry

### Build and Push to Registry

```bash
# Build image
docker build -t your-registry.com/stitch-lms:1.0.0 .

# Push to registry
docker push your-registry.com/stitch-lms:1.0.0

# Update deployment
sed -i 's|stitch-lms:latest|your-registry.com/stitch-lms:1.0.0|g' k8s/app-deployment.yaml
kubectl apply -f k8s/app-deployment.yaml
```

## 🔍 Monitoring & Debugging

### Check Pod Status

```bash
kubectl get pods -n lms
```

### View Logs

```bash
# Application logs
kubectl logs -f deployment/lms-app -n lms

# Database logs
kubectl logs -f deployment/postgres -n lms

# All logs
kubectl logs -f -l app=stitch-lms -n lms
```

### Port Forwarding (Local Access)

```bash
# Forward application
kubectl port-forward service/lms-service 5173:80 -n lms

# Forward database
kubectl port-forward service/postgres-service 5432:5432 -n lms
```

### Execute Commands in Pod

```bash
# Access application pod
kubectl exec -it deployment/lms-app -n lms -- /bin/sh

# Access database pod
kubectl exec -it deployment/postgres -n lms -- psql -U postgres -d lms_db
```

### Check Resources

```bash
# All resources
kubectl get all -n lms

# Services
kubectl get services -n lms

# Ingress
kubectl get ingress -n lms

# HPA status
kubectl get hpa -n lms
```

## 🔄 Updates & Rollouts

### Rolling Update

```bash
# Update image
kubectl set image deployment/lms-app lms-app=stitch-lms:new-tag -n lms

# Check rollout status
kubectl rollout status deployment/lms-app -n lms

# Rollback if needed
kubectl rollout undo deployment/lms-app -n lms
```

### Scale Deployment

```bash
# Scale manually
kubectl scale deployment/lms-app --replicas=5 -n lms

# HPA will auto-scale based on CPU/memory
```

## 🗑️ Cleanup

### Remove All Resources

```bash
make undeploy
```

Or manually:

```bash
kubectl delete namespace lms
```

## 📊 Resource Requirements

### Application Pods
- **Requests:** 256Mi memory, 250m CPU
- **Limits:** 512Mi memory, 500m CPU
- **Replicas:** 3 (configurable)

### Database
- **Storage:** 10Gi (configurable in PVC)
- **Requests:** 256Mi memory, 250m CPU
- **Limits:** 512Mi memory, 500m CPU

## 🔒 Security Best Practices

1. **Secrets Management:** Use Kubernetes secrets or external secret managers (Vault, AWS Secrets Manager)
2. **Network Policies:** Implement network policies to restrict pod-to-pod communication
3. **RBAC:** Use Role-Based Access Control for cluster access
4. **Image Security:** Scan images for vulnerabilities
5. **TLS/SSL:** Enable TLS in Ingress for production

## 🌍 Production Considerations

1. **Database:** Consider using managed database services (RDS, Cloud SQL) instead of in-cluster PostgreSQL
2. **Backup:** Implement regular database backups
3. **Monitoring:** Set up Prometheus + Grafana for monitoring
4. **Logging:** Use centralized logging (ELK, Loki)
5. **CI/CD:** Automate deployments with GitHub Actions, GitLab CI, or Jenkins
6. **Disaster Recovery:** Plan for backup and restore procedures

## 🐛 Troubleshooting

### Pods Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n lms

# Check pod logs
kubectl logs <pod-name> -n lms
```

### Database Connection Issues

```bash
# Verify database is running
kubectl get pods -l app=postgres -n lms

# Test connection from app pod
kubectl exec -it deployment/lms-app -n lms -- \
  node -e "require('http').get('http://localhost:5173/health', console.log)"
```

### Image Pull Errors

```bash
# Check image pull secrets
kubectl get secrets -n lms

# Verify image exists
docker images | grep stitch-lms
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)

