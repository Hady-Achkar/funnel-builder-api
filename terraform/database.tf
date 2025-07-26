# Random password for PostgreSQL admin user
resource "random_password" "postgres_admin" {
  count   = var.postgres_admin_password == null ? 1 : 0
  length  = 16
  special = true
}

# Private DNS Zone for PostgreSQL
resource "azurerm_private_dns_zone" "postgres" {
  name                = "private.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.main.name

  tags = merge(local.common_tags, {
    Environment = var.environment
  })
}

# Link Private DNS Zone to Virtual Network
resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                  = "postgres-vnet-link"
  resource_group_name   = azurerm_resource_group.main.name
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  virtual_network_id    = azurerm_virtual_network.main.id

  tags = merge(local.common_tags, {
    Environment = var.environment
  })
}

# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "psql-funnel-builder-${var.environment}"
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  version                = "15"
  delegated_subnet_id    = azurerm_subnet.database.id
  private_dns_zone_id    = azurerm_private_dns_zone.postgres.id
  administrator_login    = "funnelbuilder_admin"
  administrator_password = var.postgres_admin_password != null ? var.postgres_admin_password : random_password.postgres_admin[0].result
  zone                   = "1"
  storage_mb             = var.environment == "prod" ? 65536 : 32768
  sku_name               = local.environments[var.environment].postgres_sku

  backup_retention_days        = var.backup_retention_days
  geo_redundant_backup_enabled = var.environment == "prod" ? true : false

  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgres]

  tags = merge(local.common_tags, {
    Environment = var.environment
  })
}

# PostgreSQL Database for the application
resource "azurerm_postgresql_flexible_server_database" "app" {
  name      = "funnel_builder_${var.environment}"
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

# PostgreSQL Configuration for optimal performance
resource "azurerm_postgresql_flexible_server_configuration" "shared_preload_libraries" {
  name      = "shared_preload_libraries"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "pg_stat_statements"
}

resource "azurerm_postgresql_flexible_server_configuration" "log_statement" {
  name      = "log_statement"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "ddl"
}

# PostgreSQL Firewall Rule to allow Azure services
resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}