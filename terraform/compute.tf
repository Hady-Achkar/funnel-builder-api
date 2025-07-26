# SSH Key for VM access
resource "azurerm_ssh_public_key" "main" {
  name                = "ssh-key-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  public_key          = file(var.ssh_public_key_path)

  tags = merge(local.common_tags, {
    Environment = var.environment
  })
}

# Virtual Machine for application hosting
resource "azurerm_linux_virtual_machine" "app" {
  name                = "vm-funnel-builder-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  size                = local.environments[var.environment].vm_size
  admin_username      = var.admin_username

  # Disable password authentication in favor of SSH key
  disable_password_authentication = true

  network_interface_ids = [
    azurerm_network_interface.app.id,
  ]

  admin_ssh_key {
    username   = var.admin_username
    public_key = azurerm_ssh_public_key.main.public_key
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = local.environments[var.environment].disk_size_gb
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  # Custom data script for initial setup
  custom_data = base64encode(templatefile("${path.module}/cloud-init.yaml", {
    environment = var.environment
    postgres_host = azurerm_postgresql_flexible_server.main.fqdn
    postgres_database = azurerm_postgresql_flexible_server_database.app.name
    postgres_user = azurerm_postgresql_flexible_server.main.administrator_login
    redis_host = azurerm_redis_cache.main.hostname
    redis_port = azurerm_redis_cache.main.ssl_port
  }))

  tags = merge(local.common_tags, {
    Environment = var.environment
    Role        = "AppServer"
  })
}

# Managed disk for additional storage (optional)
resource "azurerm_managed_disk" "app_data" {
  count                = var.environment == "prod" ? 1 : 0
  name                 = "disk-app-data-${var.environment}"
  location             = azurerm_resource_group.main.location
  resource_group_name  = azurerm_resource_group.main.name
  storage_account_type = "Premium_LRS"
  create_option        = "Empty"
  disk_size_gb         = 64

  tags = merge(local.common_tags, {
    Environment = var.environment
  })
}

# Attach additional disk to production VM
resource "azurerm_virtual_machine_data_disk_attachment" "app_data" {
  count              = var.environment == "prod" ? 1 : 0
  managed_disk_id    = azurerm_managed_disk.app_data[0].id
  virtual_machine_id = azurerm_linux_virtual_machine.app.id
  lun                = "10"
  caching            = "ReadWrite"
}