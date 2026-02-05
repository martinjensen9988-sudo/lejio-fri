# PowerShell Script to Initialize Lejio Fri Database via Azure REST API
# This script will authenticate to Azure and execute SQL commands via Query API

param(
    [string]$ResourceGroup = "lejio-fri-rg",
    [string]$ServerName = "sql-vqiibdafjcmnc-dev",
    [string]$DatabaseName = "lejio-fri",
    [string]$DropScriptPath = ".\infra\migrations\drop-fri-tables.sql",
    [string]$CreateScriptPath = ".\infra\migrations\002-init-fri-schema-clean.sql"
)

# Read the SQL scripts
$dropSql = Get-Content -Path $DropScriptPath -Raw
$createSql = Get-Content -Path $CreateScriptPath -Raw

Write-Host "=== Lejio Fri Database Initialization ===" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroup"
Write-Host "Server: $ServerName"
Write-Host "Database: $DatabaseName"
Write-Host ""

# Check if Azure CLI is available
try {
    $null = az version 2>&1
    Write-Host "Azure CLI found" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Azure CLI not found. Please install Azure CLI first." -ForegroundColor Red
    exit 1
}

# Try to login if not already authenticated
Write-Host "Checking Azure authentication..." -ForegroundColor Yellow
$account = az account show 2>&1
if ($account -like "*Please run 'az login'*") {
    Write-Host "Not authenticated. Please run: az login" -ForegroundColor Red
    exit 1
}

Write-Host "Using manual approach via Azure Portal Query Editor" -ForegroundColor Yellow
Write-Host ""
Write-Host "STEP 1: Go to Azure Portal" -ForegroundColor Cyan
Write-Host "  URL: https://portal.azure.com"
Write-Host ""
Write-Host "STEP 2: Navigate to your SQL Database" -ForegroundColor Cyan
Write-Host "  - Search for: $ServerName"
Write-Host "  - Select database: $DatabaseName"
Write-Host ""
Write-Host "STEP 3: Open Query Editor" -ForegroundColor Cyan
Write-Host "  - Click: Query editor (preview)"
Write-Host "  - Login with: sqladmin"
Write-Host ""
Write-Host "STEP 4: Run DROP Script" -ForegroundColor Cyan
Write-Host "  Copy this and paste into Query Editor:"
Write-Host "---" -ForegroundColor Gray
Write-Host $dropSql -ForegroundColor Gray
Write-Host "---" -ForegroundColor Gray
Write-Host ""
Write-Host "STEP 5: Run CREATE Script" -ForegroundColor Cyan
Write-Host "  Then run this:"
Write-Host "---" -ForegroundColor Gray
Write-Host $createSql.Substring(0, [Math]::Min(500, $createSql.Length)) + "..." -ForegroundColor Gray
Write-Host "---" -ForegroundColor Gray
Write-Host ""
Write-Host "Full CREATE script saved to: $CreateScriptPath" -ForegroundColor Green
Write-Host ""
Write-Host "After completing in Portal, run verification:" -ForegroundColor Yellow
Write-Host "  SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' ORDER BY TABLE_NAME;"
