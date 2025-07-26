# Output values for the infrastructure

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "vm_public_ip" {
  description = "Public IP address of the application VM"
  value       = azurerm_public_ip.app.ip_address
}

output "vm_fqdn" {
  description = "FQDN of the application VM"
  value       = azurerm_public_ip.app.fqdn
}

output "vm_ssh_connection" {
  description = "SSH connection string for the VM"
  value       = "ssh ${var.admin_username}@${azurerm_public_ip.app.ip_address}"
}

output "postgres_fqdn" {
  description = "FQDN of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.main.fqdn
  sensitive   = true
}

output "postgres_database_name" {
  description = "Name of the PostgreSQL database"
  value       = azurerm_postgresql_flexible_server_database.app.name
}

output "postgres_admin_username" {
  description = "Administrator username for PostgreSQL"
  value       = azurerm_postgresql_flexible_server.main.administrator_login
  sensitive   = true
}

output "postgres_connection_string" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${azurerm_postgresql_flexible_server.main.administrator_login}:${var.postgres_admin_password != null ? var.postgres_admin_password : random_password.postgres_admin[0].result}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.app.name}?sslmode=require"
  sensitive   = true
}

output "redis_hostname" {
  description = "Redis cache hostname"
  value       = azurerm_redis_cache.main.hostname
  sensitive   = true
}

output "redis_ssl_port" {
  description = "Redis cache SSL port"
  value       = azurerm_redis_cache.main.ssl_port
}

output "redis_primary_key" {
  description = "Redis cache primary access key"
  value       = azurerm_redis_cache.main.primary_access_key
  sensitive   = true
}

output "redis_connection_string" {
  description = "Redis connection string"
  value       = "rediss://:${azurerm_redis_cache.main.primary_access_key}@${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port}"
  sensitive   = true
}

output "storage_account_name" {
  description = "Name of the storage account (production only)"
  value       = var.environment == "prod" ? azurerm_storage_account.main[0].name : null
}

output "storage_connection_string" {
  description = "Storage account connection string (production only)"
  value       = var.environment == "prod" ? azurerm_storage_account.main[0].primary_connection_string : null
  sensitive   = true
}

output "application_insights_instrumentation_key" {
  description = "Application Insights instrumentation key"
  value       = var.enable_monitoring ? azurerm_application_insights.main[0].instrumentation_key : null
  sensitive   = true
}

output "application_insights_connection_string" {
  description = "Application Insights connection string"
  value       = var.enable_monitoring ? azurerm_application_insights.main[0].connection_string : null
  sensitive   = true
}

output "environment_variables" {
  description = "Environment variables for the application"
  value = {
    NODE_ENV                = var.environment == "prod" ? "production" : "staging"
    PORT                    = "5000"
    DATABASE_URL           = "postgresql://${azurerm_postgresql_flexible_server.main.administrator_login}:${var.postgres_admin_password != null ? var.postgres_admin_password : random_password.postgres_admin[0].result}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.app.name}?sslmode=require"
    REDIS_URL              = "rediss://:${azurerm_redis_cache.main.primary_access_key}@${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port}"
    API_DOMAIN             = var.domain_name != "" ? var.domain_name : azurerm_public_ip.app.ip_address
    API_URL                = var.domain_name != "" ? "https://${var.domain_name}" : "http://${azurerm_public_ip.app.ip_address}:5000"
    APPINSIGHTS_INSTRUMENTATIONKEY = var.enable_monitoring ? azurerm_application_insights.main[0].instrumentation_key : ""
  }
  sensitive = true
}

output "deployment_commands" {
  description = "Commands to run for initial deployment"
  value = [
    "# Connect to VM:",
    "ssh ${var.admin_username}@${azurerm_public_ip.app.ip_address}",
    "",
    "# Clone repository:",
    "git clone https://github.com/your-username/funnel-builder-api.git /opt/funnel-builder-${var.environment}",
    "",
    "# Set up environment:",
    "cd /opt/funnel-builder-${var.environment}",
    "cp .env.example .env.${var.environment}",
    "",
    "# Update environment variables with the values from 'environment_variables' output",
    "",
    "# Install dependencies and start:",
    "pnpm install --prod",
    "npx prisma generate",
    "npx prisma migrate deploy",
    "pm2 start ecosystem.config.js --env ${var.environment}",
    "pm2 save",
    "pm2 startup",
  ]
}