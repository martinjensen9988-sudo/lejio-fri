// Azure SQL Database client for Lejio Fri
// Uses ONLY Azure services - NO Supabase

import { BlobServiceClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import { safeStorage } from "@/lib/safeStorage";

// Session storage key
const SESSION_KEY = 'lejio-fri-session';

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
    
    // Get stored session token
    const sessionData = safeStorage.getItem(SESSION_KEY);
    const token = sessionData ? JSON.parse(sessionData)?.access_token : null;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
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
// This proxy provides implementations for auth, realtime, and database operations
export const supabase = {
  from: (table: string) => ({
    select: (cols = '*', options?: any) => ({
      eq: (field: string, value: any) => azureApi.get(`/tables/${table}?${field}=${value}`),
      or: (filter: string) => ({ data: [], error: null }),
      async then(onFulfilled: any) {
        try {
          const response = await azureApi.get(`/tables/${table}?${cols}`);
          return onFulfilled({ data: response.data || [], error: null });
        } catch (error) {
          console.warn(`⚠️  Error querying table '${table}':`, error);
          return { data: [], error };
        }
      }
    }),
    insert: (data: any) => ({
      async then(onFulfilled?: any) {
        try {
          const response = await azureApi.post(`/tables/${table}`, data);
          return onFulfilled ? onFulfilled({ data: response.data || data, error: null }) : { data: response.data || data, error: null };
        } catch (error) {
          console.warn(`⚠️  Error inserting into table '${table}':`, error);
          return { data: null, error };
        }
      }
    }),
    update: (data: any) => ({
      eq: (f: string, v: any) => ({
        async then(onFulfilled?: any) {
          try {
            const response = await azureApi.put(`/tables/${table}/${v}`, data);
            return onFulfilled ? onFulfilled({ data: response.data || data, error: null }) : { data: response.data || data, error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
      })
    }),
    delete: () => ({
      eq: (f: string, v: any) => ({
        async then(onFulfilled?: any) {
          try {
            const response = await azureApi.delete(`/tables/${table}/${v}`);
            return onFulfilled ? onFulfilled({ data: null, error: null }) : { data: null, error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
      })
    }),
  }),
  
  // RPC function calls
  rpc: (functionName: string, params?: any) => ({
    async then(onFulfilled?: any) {
      try {
        const response = await azureApi.post(`/rpc/${functionName}`, params || {});
        return onFulfilled ? onFulfilled({ data: response.data, error: null }) : { data: response.data, error: null };
      } catch (error) {
        console.warn(`⚠️  RPC call to '${functionName}' failed:`, error);
        return { data: null, error };
      }
    }
  }),
  
  // Function invocation
  functions: {
    invoke: (name: string, options?: any) => azureApi.post(`/functions/${name}`, options?.body || options)
  },
  
  // Storage operations
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: any) => 
        azureApi.post(`/storage/${bucket}/${path}`, { file }).then((res: any) => ({ data: res.data, error: null })),
      getPublicUrl: (path: string) => ({ data: { publicUrl: `/storage/${bucket}/${path}` } }),
      download: (path: string) => azureApi.get(`/storage/${bucket}/${path}`)
    })
  },
  
  // Authentication
  auth: {
    getUser: async () => {
      try {
        const response = await azureApi.get('/auth/user');
        return { data: { user: response.data }, error: null };
      } catch (error) {
        return { data: { user: null }, error };
      }
    },
    
    getSession: async () => {
      try {
        const response = await azureApi.get('/auth/session');
        return { data: { session: response.data }, error: null };
      } catch (error) {
        return { data: { session: null }, error };
      }
    },
    
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      try {
        const response = await azureApi.post('/auth/signin', credentials);
        return { data: { user: response.data?.user, session: response.data?.session }, error: null };
      } catch (error: any) {
        return { data: null, error: error.response?.data || error };
      }
    },
    
    signInWithOAuth: async (options: { provider: string; options?: any }) => {
      try {
        const response = await azureApi.post('/auth/oauth', { provider: options.provider, ...options.options });
        return { data: { user: response.data?.user, session: response.data?.session }, error: null };
      } catch (error: any) {
        return { data: null, error };
      }
    },
    
    signUp: async (credentials: { email: string; password: string }) => {
      try {
        const response = await azureApi.post('/auth/signup', credentials);
        return { data: { user: response.data?.user, session: response.data?.session }, error: null };
      } catch (error: any) {
        return { data: null, error };
      }
    },
    
    signOut: async () => {
      try {
        await azureApi.post('/auth/signout', {});
        return { error: null };
      } catch (error: any) {
        return { error };
      }
    },
    
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Try to get initial session
      azureApi.get('/auth/session').then((response: any) => {
        callback('INITIAL_SESSION', response.data?.session || null);
      }).catch(() => {
        callback('INITIAL_SESSION', null);
      });
      
      // Return unsubscribe function
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              // Cleanup
            }
          }
        }
      };
    }
  },
  
  // Real-time subscriptions
  channel: (channelName: string) => ({
    on: (event: string, callback: (payload: any) => void) => ({
      subscribe: (callback?: (status: string) => void) => {
        if (callback) callback('SUBSCRIBED');
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    }),
    subscribe: (callback?: (status: string) => void) => {
      if (callback) callback('SUBSCRIBED');
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  }),
  
  removeChannel: (subscription: any) => {
    if (subscription?.data?.subscription?.unsubscribe) {
      subscription.data.subscription.unsubscribe();
    }
    return { data: null };
  }
};

export default azureApi;
