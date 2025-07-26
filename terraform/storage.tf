# Storage Account for backups and file storage (production only)
resource "azurerm_storage_account" "main" {
  count                    = var.environment == "prod" ? 1 : 0
  name                     = "stfunnelbuilder${var.environment}${random_id.storage_suffix[0].hex}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  
  # Security settings
  min_tls_version                = "TLS1_2"
  allow_nested_items_to_be_public = false
  
  blob_properties {
    delete_retention_policy {
      days = var.backup_retention_days
    }
    container_delete_retention_policy {
      days = var.backup_retention_days
    }
  }

  tags = merge(local.common_tags, {
    Environment = var.environment
  })
}

# Random ID for storage account name uniqueness
resource "random_id" "storage_suffix" {
  count       = var.environment == "prod" ? 1 : 0
  byte_length = 4
}

# Storage Container for application backups
resource "azurerm_storage_container" "backups" {
  count                 = var.environment == "prod" ? 1 : 0
  name                  = "backups"
  storage_account_name  = azurerm_storage_account.main[0].name
  container_access_type = "private"
}

# Storage Container for application uploads
resource "azurerm_storage_container" "uploads" {
  count                 = var.environment == "prod" ? 1 : 0
  name                  = "uploads"
  storage_account_name  = azurerm_storage_account.main[0].name
  container_access_type = "private"
}