#!/bin/bash

# Azure Deployment Script for Lejio Fri (DANSK)
# Kør dette i Azure Cloud Shell eller lokalt med Azure CLI
# bash azure-deploy.sh

set -e

echo "🚀 Starter Azure Deployment for Lejio Fri..."

# Konfiguration
RESOURCE_GROUP="lejio-fri-rg"
LOCATION="eastus"
PROJECT_NAME="lejio-fri"
ENVIRONMENT="dev"
DEPLOYMENT_NAME="lejio-fri-deployment-$(date +%s)"

# Farver til output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # Ingen farve

echo -e "${BLUE}📋 Konfiguration:${NC}"
echo "  Ressourcegruppe: $RESOURCE_GROUP"
echo "  Lokation: $LOCATION"
echo "  Projekt: $PROJECT_NAME"
echo "  Miljø: $ENVIRONMENT"
echo ""

# Step 1: Verificer Azure CLI
echo -e "${BLUE}1️⃣  Verificerer Azure CLI...${NC}"
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI ikke fundet. Installer fra: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi
echo -e "${GREEN}✅ Azure CLI fundet: $(az --version | head -1)${NC}"
echo ""

# Step 2: Login
echo -e "${BLUE}2️⃣  Logger ind i Azure...${NC}"
az login
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo -e "${GREEN}✅ Logget ind. Subscription ID: $SUBSCRIPTION_ID${NC}"
echo ""

# Step 3: Opret Ressourcegruppe
echo -e "${BLUE}3️⃣  Opretter Ressourcegruppe...${NC}"
if az group exists -n $RESOURCE_GROUP -o tsv | grep -q true; then
    echo "  Ressourcegruppe eksisterer allerede"
else
    az group create \
        --name $RESOURCE_GROUP \
        --location $LOCATION
fi
echo -e "${GREEN}✅ Ressourcegruppe klar: $RESOURCE_GROUP${NC}"
echo ""

# Step 4: Validér Deployment
echo -e "${BLUE}4️⃣  Validerer Bicep template...${NC}"
az deployment group validate \
    --resource-group $RESOURCE_GROUP \
    --template-file infra/main.bicep \
    --parameters infra/main.parameters.json
echo -e "${GREEN}✅ Template validering bestået${NC}"
echo ""

# Step 5: Forhåndsvis Deployment
echo -e "${BLUE}5️⃣  Forhåndsvisning af deployment (what-if)...${NC}"
echo "  Dette viser hvad der bliver oprettet/modificeret:"
echo ""
az deployment group what-if \
    --resource-group $RESOURCE_GROUP \
    --template-file infra/main.bicep \
    --parameters infra/main.parameters.json
echo ""

# Step 6: Bekræft Deployment
echo -e "${BLUE}6️⃣  Klar til deployment. Fortsæt? (j/n)${NC}"
read -p "  > " CONFIRM
if [ "$CONFIRM" != "j" ] && [ "$CONFIRM" != "y" ]; then
    echo "❌ Deployment annulleret"
    exit 1
fi
echo ""

# Step 7: Deploy Infrastruktur
echo -e "${BLUE}7️⃣  Deployer infrastruktur...${NC}"
echo "  Dette kan tage 5-10 minutter..."
echo ""

az deployment group create \
    --name $DEPLOYMENT_NAME \
    --resource-group $RESOURCE_GROUP \
    --template-file infra/main.bicep \
    --parameters infra/main.parameters.json

echo -e "${GREEN}✅ Infrastruktur deployeret${NC}"
echo ""

# Step 8: Hent Deployment Outputs
echo -e "${BLUE}8️⃣  Henter deployment resultater...${NC}"
echo ""

OUTPUTS=$(az deployment group show \
    --name $DEPLOYMENT_NAME \
    --resource-group $RESOURCE_GROUP \
    --query properties.outputs -o json)

echo "Deployment Resultater:"
echo "$OUTPUTS" | jq '.'

# Ekstrahér værdier
SQL_SERVER=$(echo "$OUTPUTS" | jq -r '.sqlServerName.value')
STATIC_WEB_APP=$(echo "$OUTPUTS" | jq -r '.staticWebAppUrl.value' 2>/dev/null || echo "N/A")
FUNCTION_APP=$(echo "$OUTPUTS" | jq -r '.functionAppUrl.value' 2>/dev/null || echo "N/A")
KEY_VAULT=$(echo "$OUTPUTS" | jq -r '.keyVaultUrl.value' 2>/dev/null || echo "N/A")
STORAGE=$(echo "$OUTPUTS" | jq -r '.storageAccountName.value')

echo ""
echo -e "${GREEN}✅ Deployment Færdig!${NC}"
echo ""
echo -e "${BLUE}📊 Vigtig Information:${NC}"
echo "  SQL Server: $SQL_SERVER"
echo "  Storage Account: $STORAGE"
echo "  Static Web App: $STATIC_WEB_APP"
echo "  Function App: $FUNCTION_APP"
echo "  Key Vault: $KEY_VAULT"
echo ""

# Step 9: Næste Trin
echo -e "${BLUE}📝 Næste Trin:${NC}"
echo ""
echo "1. Opdater .env.azure med Azure ressource værdier:"
echo "   VITE_API_URL=https://${FUNCTION_APP}/api"
echo "   VITE_SQL_SERVER=${SQL_SERVER}"
echo ""
echo "2. Konfigurer GitHub Static Web Apps:"
echo "   - Gå til Azure Portal → Static Web Apps → swa-lejio-fri-dev"
echo "   - Kopier Repository token fra Overview"
echo "   - Tilføj til GitHub Secrets: AZURE_STATIC_WEB_APPS_API_TOKEN"
echo ""
echo "3. Kør database migrationer:"
echo "   sqlcmd -S ${SQL_SERVER}.database.windows.net -U sqladmin -P <PASSWORD> -d lejio-fri"
echo "   > :r supabase/migrations/azure-sql/001_initial_schema.sql"
echo "   > :r supabase/migrations/azure-sql/006_test_martin_account.sql"
echo ""
echo "4. Deploy Azure Functions:"
echo "   cd azure-functions"
echo "   func azure functionapp publish func-lejio-fri-dev"
echo ""
echo "5. Push til GitHub for at trigger Static Web Apps auto-deployment:"
echo "   git add ."
echo "   git commit -m 'Migrer til Azure'"
echo "   git push origin main"
echo ""

echo -e "${GREEN}🎉 Deployment script færdig!${NC}"
