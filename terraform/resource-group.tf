# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "rg-funnel-builder-${var.environment}"
  location = var.location

  tags = merge(local.common_tags, {
    Environment = var.environment
  })
}