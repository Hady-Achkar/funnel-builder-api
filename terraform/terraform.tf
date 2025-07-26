# Backend configuration for Terraform state management
# Uncomment and configure for production use

# terraform {
#   backend "azurerm" {
#     resource_group_name  = "rg-terraform-state"
#     storage_account_name = "stterraformstate12345"
#     container_name       = "tfstate"
#     key                  = "funnel-builder-api.terraform.tfstate"
#   }
# }

# Example of setting up remote state storage:
# 1. Create a storage account for Terraform state
# 2. Create a container named "tfstate"
# 3. Uncomment the backend configuration above
# 4. Update the values with your actual storage account details
# 5. Run: terraform init -migrate-state