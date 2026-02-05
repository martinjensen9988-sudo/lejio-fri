// Main Bicep template for Lejio Fri on Azure
// Deploys: Static Web App, SQL Database, Key Vault, Functions, Storage

param environment string = 'dev'
param location string = resourceGroup().location
param projectName string = 'lejio-fri'

// Database parameters
param sqlAdminUsername string
@secure()
param sqlAdminPassword string

// Static Web App GitHub integration
param githubRepo string = 'martinjensen9988-sudo/lejio-b75cff1f'
param githubBranch string = 'main'

// Naming
var resourceSuffix = '${projectName}-${environment}'
var sqlServerName = 'sql-${uniqueString(resourceGroup().id)}-${environment}'
var keyVaultName = 'kv-${uniqueString(subscription().subscriptionId, resourceGroup().location)}-${environment}'
var storageAccountName = 'st${replace(projectName, '-', '')}${environment}'
var functionAppName = 'func-${resourceSuffix}'
var staticWebAppName = 'swa-${resourceSuffix}'

// Deploy modules
module sqlDatabase 'modules/sql.bicep' = {
  name: 'sqlDatabase'
  params: {
    location: location
    sqlServerName: sqlServerName
    adminUsername: sqlAdminUsername
    adminPassword: sqlAdminPassword
  }
}

module storage 'modules/storage.bicep' = {
  name: 'storage'
  params: {
    location: location
    storageAccountName: storageAccountName
  }
}

module keyVault 'modules/keyvault.bicep' = {
  name: 'keyVault'
  params: {
    location: location
    keyVaultName: keyVaultName
    sqlConnectionString: sqlDatabase.outputs.connectionString
    storageAccountKey: 'placeholder' // Will be set via policy post-deployment
  }
}

module functions 'modules/functions.bicep' = {
  name: 'functions'
  params: {
    location: location
    functionAppName: functionAppName
    keyVaultName: keyVaultName
    sqlConnectionString: sqlDatabase.outputs.connectionString
    storageConnectionString: 'BlobEndpoint=https://${storage.outputs.storageAccountName}.blob.core.windows.net/;SharedAccessSignature=sv=2023-01-01&ss=b&srt=sco&sp=rwdlac&se=2099-12-31T23:59:59Z'
  }
}

module staticWebApp 'modules/staticwebapp.bicep' = {
  name: 'staticWebApp'
  params: {
    location: location
    staticWebAppName: staticWebAppName
    githubRepo: githubRepo
    githubBranch: githubBranch
    functionAppUrl: functions.outputs.functionAppUrl
  }
}

// Outputs
output sqlServerName string = sqlDatabase.outputs.serverName
output keyVaultUrl string = keyVault.outputs.keyVaultUrl
output staticWebAppUrl string = staticWebApp.outputs.defaultHostname
output functionAppUrl string = functions.outputs.functionAppUrl
output storageAccountName string = storage.outputs.storageAccountName
