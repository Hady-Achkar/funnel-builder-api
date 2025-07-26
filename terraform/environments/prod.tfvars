# Production environment configuration

environment = "prod"
location    = "East US"

# VM Configuration
admin_username = "azureuser"

# Network Security - RESTRICT THESE TO YOUR ACTUAL IP ADDRESSES
allowed_ssh_ips = [
  "0.0.0.0/0"  # CRITICAL: Change this to your actual IP addresses
  # Example:
  # "203.0.113.0/32",    # Your office IP
  # "198.51.100.0/32",   # Your home IP
]

# Domain Configuration
domain_name = "api.digitalsite.com"  # Your production domain

# Monitoring
enable_monitoring = true

# Backup Settings
backup_retention_days = 30

# Database Security - SET A STRONG PASSWORD
# postgres_admin_password = "CHANGE-THIS-TO-A-STRONG-PASSWORD"

# SECURITY CHECKLIST FOR PRODUCTION:
# 1. Set postgres_admin_password to a strong, unique password
# 2. Restrict allowed_ssh_ips to your actual IP addresses
# 3. Set up proper DNS for your domain_name
# 4. Configure SSL certificates after deployment
# 5. Set up monitoring alerts
# 6. Configure backup retention policies
# 7. Review and harden network security groups