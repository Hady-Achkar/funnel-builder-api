# Variables for funnel-builder-api infrastructure

variable "environment" {
  description = "Environment name (dev or prod)"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be either 'dev' or 'prod'."
  }
}

variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "East US"
}

variable "admin_username" {
  description = "Admin username for the virtual machine"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key file"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "allowed_ssh_ips" {
  description = "List of IP addresses allowed to SSH to the VM"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Restrict this in production!
}

variable "domain_name" {
  description = "Domain name for the environment"
  type        = string
  default     = ""
}

variable "postgres_admin_password" {
  description = "Password for PostgreSQL admin user"
  type        = string
  sensitive   = true
  default     = null
}

variable "enable_monitoring" {
  description = "Enable Azure Monitor and Log Analytics"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}