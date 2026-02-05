// Azure Storage Account module
// For file uploads: vehicle images, documents, avatars

param location string
param storageAccountName string

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_GRS' // Geo-redundant storage for production
  }
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false // Security: block public access
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
  }
}

// Container: Vehicle Images
resource vehicleImagesContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/vehicle-images'
  properties: {
    publicAccess: 'None' // Private
  }
}

// Container: Documents
resource documentsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/documents'
  properties: {
    publicAccess: 'None'
  }
}

// Container: User Avatars
resource avatarsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/avatars'
  properties: {
    publicAccess: 'None'
  }
}

// Container: Damage Reports
resource damageContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/damage-reports'
  properties: {
    publicAccess: 'None'
  }
}

// Outputs (secrets removed from outputs as per best practices)
output storageAccountName string = storageAccount.name
output storageAccountId string = storageAccount.id
output primaryBlobEndpoint string = storageAccount.properties.primaryEndpoints.blob
