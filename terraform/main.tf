# Terraform configuration for funnel-builder-api Azure infrastructure
terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# Configure the Microsoft Azure Provider
provider "azurerm" {
  features {}
}

# Data source for current client configuration
data "azurerm_client_config" "current" {}

# Local variables
locals {
  common_tags = {
    Project     = "funnel-builder-api"
    ManagedBy   = "terraform"
    Repository  = "funnel-builder-api"
  }
  
  environments = {
    dev = {
      vm_size           = "Standard_B2s"
      disk_size_gb     = 64
      enable_backups   = false
      postgres_sku     = "B_Gen5_1"
      redis_capacity   = 1
      redis_family     = "C"
      redis_sku_name   = "Basic"
    }
    prod = {
      vm_size           = "Standard_D2s_v3"
      disk_size_gb     = 128
      enable_backups   = true
      postgres_sku     = "GP_Gen5_2"
      redis_capacity   = 1
      redis_family     = "C"
      redis_sku_name   = "Standard"
    }
  }
}