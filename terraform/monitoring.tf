# Log Analytics Workspace for monitoring
resource "azurerm_log_analytics_workspace" "main" {
  count               = var.enable_monitoring ? 1 : 0
  name                = "law-funnel-builder-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = var.environment == "prod" ? 90 : 30

  tags = merge(local.common_tags, {
    Environment = var.environment
  })
}

# Application Insights for application monitoring
resource "azurerm_application_insights" "main" {
  count               = var.enable_monitoring ? 1 : 0
  name                = "ai-funnel-builder-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main[0].id
  application_type    = "Node.JS"

  tags = merge(local.common_tags, {
    Environment = var.environment
  })
}

# VM Insights for VM monitoring
resource "azurerm_virtual_machine_extension" "vm_insights" {
  count                      = var.enable_monitoring ? 1 : 0
  name                       = "VMInsights"
  virtual_machine_id         = azurerm_linux_virtual_machine.app.id
  publisher                  = "Microsoft.Azure.Monitor"
  type                       = "AzureMonitorLinuxAgent"
  type_handler_version       = "1.0"
  auto_upgrade_minor_version = true

  settings = jsonencode({
    workspaceId = azurerm_log_analytics_workspace.main[0].workspace_id
  })

  protected_settings = jsonencode({
    workspaceKey = azurerm_log_analytics_workspace.main[0].primary_shared_key
  })

  tags = merge(local.common_tags, {
    Environment = var.environment
  })
}

# Action Group for alerts
resource "azurerm_monitor_action_group" "main" {
  count               = var.enable_monitoring && var.environment == "prod" ? 1 : 0
  name                = "ag-funnel-builder-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = "funnelalert"

  # Add email notification (configure as needed)
  email_receiver {
    name          = "admin"
    email_address = "admin@digitalsite.com"
  }

  tags = merge(local.common_tags, {
    Environment = var.environment
  })
}

# CPU Alert for VM
resource "azurerm_monitor_metric_alert" "vm_cpu" {
  count               = var.enable_monitoring && var.environment == "prod" ? 1 : 0
  name                = "alert-vm-cpu-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_linux_virtual_machine.app.id]
  description         = "Action will be triggered when CPU usage exceeds 80%"
  
  criteria {
    metric_namespace = "Microsoft.Compute/virtualMachines"
    metric_name      = "Percentage CPU"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.main[0].id
  }

  tags = merge(local.common_tags, {
    Environment = var.environment
  })
}

# Database Connection Alert
resource "azurerm_monitor_metric_alert" "db_connections" {
  count               = var.enable_monitoring && var.environment == "prod" ? 1 : 0
  name                = "alert-db-connections-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_postgresql_flexible_server.main.id]
  description         = "Action will be triggered when database connections exceed 80%"
  
  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "active_connections"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.main[0].id
  }

  tags = merge(local.common_tags, {
    Environment = var.environment
  })
}