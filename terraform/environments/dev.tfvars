# Development environment configuration

environment = "dev"
location    = "East US"

# VM Configuration
admin_username = "azureuser"

# Network Security
allowed_ssh_ips = [
  "0.0.0.0/0"  # CHANGE THIS: Restrict to your IP addresses
]

# Domain Configuration
domain_name = "new-api-dev.digitalsite.com"

# Monitoring
enable_monitoring = true

# Backup Settings
backup_retention_days = 7

# Note: postgres_admin_password will be auto-generated if not provided
# To set a custom password, uncomment and set:
# postgres_admin_password = "your-secure-password-here"