# Redis Cache for session storage and caching
resource "azurerm_redis_cache" "main" {
  name                = "redis-funnel-builder-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = local.environments[var.environment].redis_capacity
  family              = local.environments[var.environment].redis_family
  sku_name            = local.environments[var.environment].redis_sku_name
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  # Redis configuration
  redis_configuration {
    enable_authentication           = true
    maxmemory_reserved              = var.environment == "prod" ? 50 : 25
    maxmemory_delta                 = var.environment == "prod" ? 50 : 25
    maxmemory_policy                = "allkeys-lru"
    notify_keyspace_events          = ""
    rdb_backup_enabled              = var.environment == "prod" ? true : false
    rdb_backup_frequency            = var.environment == "prod" ? 60 : null
    rdb_backup_max_snapshot_count   = var.environment == "prod" ? 1 : null
    rdb_storage_connection_string   = var.environment == "prod" ? azurerm_storage_account.main[0].primary_blob_connection_string : null
  }

  # Public network access
  public_network_access_enabled = true

  tags = merge(local.common_tags, {
    Environment = var.environment
  })
}

# Redis Firewall Rule to allow access from VM
resource "azurerm_redis_firewall_rule" "app_vm" {
  name               = "AllowAppVM"
  redis_cache_name   = azurerm_redis_cache.main.name
  resource_group_name = azurerm_resource_group.main.name
  start_ip           = azurerm_public_ip.app.ip_address
  end_ip             = azurerm_public_ip.app.ip_address
}