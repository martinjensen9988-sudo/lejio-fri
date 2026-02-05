// Azure Static Web Apps module
// Hosts the Vite React frontend with GitHub integration

param location string
param staticWebAppName string
param githubRepo string
param githubBranch string
param functionAppUrl string

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: 'https://github.com/${githubRepo}'
    branch: githubBranch
    buildProperties: {
      appLocation: '/'
      appArtifactLocation: 'dist'
      outputLocation: 'dist'
      skipGithubActionWorkflowGeneration: false
    }
    stagingEnvironmentPolicy: 'Disabled'
    allowConfigFileUpdates: true
    provider: 'GitHub'
  }
}

// Output
output defaultHostname string = staticWebApp.properties.defaultHostname
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output staticWebAppId string = staticWebApp.id
