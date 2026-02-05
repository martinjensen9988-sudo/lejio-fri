# Disconnect GitHub integration from Azure Static Web Apps
# This allows direct deployment via CLI/API instead of GitHub Actions

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_static_site" "lejio_fri" {
  name                = "Lejio-fri"
  resource_group_name = "Lejio-Fri"
  location            = "West Europe"
  
  # This will disconnect GitHub integration when applied
  # It creates a "disconnected" static site that accepts direct deployments
}

output "lejio_fri_default_host_name" {
  value = azurerm_static_site.lejio_fri.default_host_name
}

output "lejio_fri_id" {
  value = azurerm_static_site.lejio_fri.id
}
