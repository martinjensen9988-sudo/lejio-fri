// Azure SQL Database client for Lejio Fri
// Uses ONLY Azure services - NO Supabase

import { BlobServiceClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

// Environment configuration
const SQL_SERVER = import.meta.env.VITE_SQL_SERVER || "lejio-fri.database.windows.net";
const SQL_DATABASE = import.meta.env.VITE_SQL_DATABASE || "lejio-fri";
const STORAGE_ACCOUNT = import.meta.env.VITE_STORAGE_ACCOUNT;
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7071/api";
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || "development";

// Initialize Azure Blob Storage client
let blobClient: BlobServiceClient | null = null;

export async function initializeAzureClients() {
  try {
    // Use DefaultAzureCredential for managed identity
    const credential = new DefaultAzureCredential();
    
    // Initialize Blob Storage client
    if (STORAGE_ACCOUNT) {
      blobClient = new BlobServiceClient(
        `https://${STORAGE_ACCOUNT}.blob.core.windows.net`,
        credential
      );
      console.log("✅ Azure Blob Storage client initialized");
    }
  } catch (error) {
    console.error("Failed to initialize Azure clients:", error);
  }
}

// API Client for communication with Azure Functions backend
export const azureApi: {
  request<T>(endpoint: string, options?: RequestInit): Promise<T>;
  get<T>(endpoint: string): Promise<T>;
  post<T>(endpoint: string, data?: any): Promise<T>;
  put<T>(endpoint: string, data?: any): Promise<T>;
  patch<T>(endpoint: string, data?: any): Promise<T>;
  delete<T>(endpoint: string): Promise<T>;
} = {
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} - ${error.message || response.statusText}`);
    }

    return response.json();
  },

  async get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "GET" });
  },

  async post<T>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async put<T>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async patch<T>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  },
};

// File upload to Azure Blob Storage
export async function uploadFile(
  containerName: string,
  fileName: string,
  file: File
): Promise<string> {
  if (!blobClient) {
    throw new Error("Azure Blob Storage client not initialized");
  }

  try {
    const containerClient = blobClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.upload(file, file.size);
    
    return blockBlobClient.url;
  } catch (error) {
    console.error("File upload failed:", error);
    throw error;
  }
}

// Download file from Azure Blob Storage
export async function downloadFile(containerName: string, fileName: string): Promise<Blob> {
  if (!blobClient) {
    throw new Error("Azure Blob Storage client not initialized");
  }

  try {
    const containerClient = blobClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    const downloadBlockBlobResponse = await blockBlobClient.download();
    return downloadBlockBlobResponse.readableStreamBody as unknown as Blob;
  } catch (error) {
    console.error("File download failed:", error);
    throw error;
  }
}

// Configuration export
export const azureConfig = {
  sqlServer: SQL_SERVER,
  database: SQL_DATABASE,
  storageAccount: STORAGE_ACCOUNT,
  apiUrl: API_URL,
  environment: ENVIRONMENT,
};

// Proxy for backwards compatibility - routes Supabase-like calls to Azure API
export const supabase = {
  from: (table: string) => ({
    select: (cols = '*') => ({
      eq: (field: string, value: any) => azureApi.get(`/tables/${table}?${field}=${value}`),
      async then(onFulfilled: any) {
        console.warn(`⚠️  Direct Supabase call to table '${table}' through proxy`);
        return { data: [], error: null };
      }
    }),
    insert: (data: any) => ({ then: async (cb: any) => azureApi.post(`/tables/${table}`, data) }),
    update: (data: any) => ({ eq: (f: string, v: any) => azureApi.put(`/tables/${table}/${v}`, data) }),
    delete: () => ({ eq: (f: string, v: any) => azureApi.delete(`/tables/${table}/${v}`) }),
  }),
  functions: {
    invoke: (name: string, options?: any) => azureApi.post(`/functions/${name}`, options?.body)
  },
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: any) => azureApi.post(`/storage/${bucket}/${path}`, { file }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: `/storage/${bucket}/${path}` } })
    })
  },
  auth: {
    getUser: async () => ({ data: { user: null } })
  }
};

export default azureApi;
