# Funnel-Builder-API Azure Infrastructure

This Terraform configuration creates Azure infrastructure for the funnel-builder-api project, supporting both development and production environments.

## 🏗️ Infrastructure Components

### Compute Resources
- **Virtual Machine**: Ubuntu 22.04 LTS with auto-configuration
- **Public IP**: Static IP for external access
- **Managed Disks**: Premium SSD storage with additional data disk for production

### Database Services
- **PostgreSQL Flexible Server**: Managed PostgreSQL 15 with private networking
- **Redis Cache**: Managed Redis for session storage and caching

### Networking
- **Virtual Network**: Isolated network with app and database subnets
- **Network Security Groups**: Firewall rules for web traffic and SSH
- **Private DNS**: Secure database connectivity

### Storage & Monitoring
- **Storage Account**: File storage and backups (production only)
- **Application Insights**: Application performance monitoring
- **Log Analytics**: Centralized logging and monitoring
- **Alerts**: CPU and database connection monitoring (production)

## 🚀 Environment Configurations

### Development (`dev`)
- **VM Size**: Standard_B2s (2 vCPUs, 4GB RAM)
- **Storage**: 64GB Premium SSD
- **PostgreSQL**: B_Gen5_1 (1 vCore, 2GB RAM)
- **Redis**: Basic tier (1GB)
- **Backups**: 7 days retention
- **Monitoring**: Enabled

### Production (`prod`)
- **VM Size**: Standard_D2s_v3 (2 vCPUs, 8GB RAM)
- **Storage**: 128GB Premium SSD + 64GB data disk
- **PostgreSQL**: GP_Gen5_2 (2 vCores, 5GB RAM) with geo-redundant backups
- **Redis**: Standard tier (1GB) with backups
- **Storage Account**: For file uploads and backups
- **Backups**: 30 days retention
- **Monitoring**: Full monitoring with alerts

## 📋 Prerequisites

1. **Azure CLI**: Install and login
   ```bash
   az login
   az account set --subscription "Your Subscription ID"
   ```

2. **Terraform**: Install Terraform >= 1.0
   ```bash
   # macOS
   brew install terraform
   
   # Or download from https://terraform.io/downloads
   ```

3. **SSH Key**: Generate SSH key pair
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa
   ```

## 🚀 Deployment Instructions

### 1. Initialize Terraform
```bash
cd terraform
terraform init
```

### 2. Deploy Development Environment
```bash
# Plan the deployment
terraform plan -var-file="environments/dev.tfvars"

# Apply the configuration
terraform apply -var-file="environments/dev.tfvars"
```

### 3. Deploy Production Environment
```bash
# Plan the deployment
terraform plan -var-file="environments/prod.tfvars"

# Apply the configuration
terraform apply -var-file="environments/prod.tfvars"
```

## 🔧 Post-Deployment Setup

### 1. Connect to VM
```bash
# Get VM IP from Terraform output
VM_IP=$(terraform output -raw vm_public_ip)
ssh azureuser@$VM_IP
```

### 2. Clone and Setup Application
```bash
# Clone repository
git clone https://github.com/your-username/funnel-builder-api.git /opt/funnel-builder-staging
cd /opt/funnel-builder-staging

# Install dependencies
pnpm install --prod

# Setup environment
cp .env.example .env.staging
# Edit .env.staging with database and Redis connection strings from Terraform outputs

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate deploy

# Start with PM2
pm2 start ecosystem.config.js --env staging
pm2 save
pm2 startup
```

### 3. Configure SSL (Production)
```bash
# Install SSL certificate
sudo certbot --nginx -d your-domain.com

# Update nginx configuration for your domain
# See nginx configuration files in the project
```

## 📊 Getting Infrastructure Information

### View All Outputs
```bash
terraform output
```

### Specific Outputs
```bash
# VM connection
terraform output vm_ssh_connection

# Database connection string
terraform output postgres_connection_string

# Redis connection string  
terraform output redis_connection_string

# Environment variables for .env file
terraform output environment_variables
```

## 🔒 Security Considerations

### For Development:
- ✅ Network security groups configured
- ✅ SSH key authentication only
- ✅ Private database networking
- ⚠️ SSH access open to 0.0.0.0/0 (restrict in dev.tfvars)

### For Production:
- 🔴 **CRITICAL**: Update `allowed_ssh_ips` in `prod.tfvars` to your actual IP addresses
- 🔴 **CRITICAL**: Set `postgres_admin_password` in `prod.tfvars` to a strong password
- ✅ Geo-redundant database backups
- ✅ Storage encryption enabled
- ✅ Monitoring and alerting configured
- ✅ Firewall rules for application ports only

## 💰 Cost Estimation

### Development (Monthly):
- VM (Standard_B2s): ~$60
- PostgreSQL (B_Gen5_1): ~$25
- Redis (Basic 1GB): ~$15
- **Total**: ~$100/month

### Production (Monthly):
- VM (Standard_D2s_v3): ~$120
- PostgreSQL (GP_Gen5_2): ~$90
- Redis (Standard 1GB): ~$30
- Storage Account: ~$5
- Monitoring: ~$10
- **Total**: ~$255/month

## 🗑️ Cleanup

### Destroy Environment
```bash
# Development
terraform destroy -var-file="environments/dev.tfvars"

# Production
terraform destroy -var-file="environments/prod.tfvars"
```

## 🔧 Customization

### Adding Custom Domains
1. Update `domain_name` in the `.tfvars` file
2. Configure DNS to point to the VM's public IP
3. Update nginx configuration after deployment
4. Install SSL certificate with Let's Encrypt

### Scaling Resources
1. Update VM size in `variables.tf` and `locals.tf`
2. Update PostgreSQL SKU for better performance
3. Increase Redis capacity for more cache storage

### Adding Additional Services
- **Azure Container Registry**: For Docker image storage
- **Azure Key Vault**: For secrets management
- **Azure CDN**: For static asset delivery
- **Azure Load Balancer**: For high availability

## 📞 Support

For infrastructure issues:
1. Check Terraform state: `terraform show`
2. Review Azure portal for resource status
3. Check VM logs: `ssh azureuser@VM_IP` then `sudo journalctl -f`
4. Monitor Application Insights for application issues

## 🔄 Updates

To update infrastructure:
1. Modify Terraform files
2. Run `terraform plan` to review changes
3. Apply with `terraform apply`
4. Update application deployment if needed