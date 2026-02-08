/**
 * Azure SQL Client for Lejio Fri (Lessor Platform)
 * Connects to: Azure SQL Database via REST API
 * 
 * Usage:
 * - All database calls via Azure Functions REST endpoints
 * - All lessor_* tables stored in Azure SQL
 * - Auth handled by Supabase
 */

const API_BASE_URL = import.meta.env.VITE_AZURE_API_URL || 'https://api.lejio-fri.com';

/**
 * Initialize Azure SQL connection
 * All database calls go through Azure Functions REST endpoints
 */
export async function initializeAzureDb() {
  console.log('✅ Azure SQL initialized (API: ' + API_BASE_URL + ')');
  return true;
}

/**
 * Make request to Azure Functions API
 */
export async function fetchAzureAPI(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Azure API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Query wrapper for Azure SQL (via REST)
 */
export async function queryAzure(endpoint: string, params: any = {}) {
  return fetchAzureAPI(endpoint, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Disconnect from Azure (no-op for REST API)
 */
export async function disconnectAzure() {
  console.log('✅ Azure connection closed');
  return true;
}

