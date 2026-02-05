// Azure Key Vault module
// Securely stores connection strings and secrets

param location string
param keyVaultName string
param sqlConnectionString string
@secure()
param storageAccountKey string

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: false
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    accessPolicies: []
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
    enablePurgeProtection: true // Security best practice
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
  }
}

// Secret: SQL Connection String
resource sqlConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'sql-connection-string'
  properties: {
    value: sqlConnectionString
    contentType: 'text/plain'
  }
}

// Secret: Storage Account Key
resource storageKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'storage-account-key'
  properties: {
    value: storageAccountKey
    contentType: 'text/plain'
  }
}

// Outputs
output keyVaultName string = keyVault.name
output keyVaultUrl string = keyVault.properties.vaultUri
output sqlConnectionStringSecretUrl string = sqlConnectionStringSecret.properties.secretUriWithVersion
output storageKeySecretUrl string = storageKeySecret.properties.secretUriWithVersion
