import { useState, useEffect } from 'react';
import { azureApi } from '@/integrations/azure/client';

const generateApiKey = () => {
  // Generate a random alphanumeric string
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export interface ApiKey {
  id: string;
  lessor_id: string;
  name: string;
  key: string; // Masked key like "sk_live_...****"
  full_key?: string; // Only returned on creation
  status: 'active' | 'inactive';
  last_used_at?: string;
  created_at: string;
  expires_at?: string;
}

interface UseFriApiKeysReturn {
  apiKeys: ApiKey[];
  loading: boolean;
  error: string | null;
  fetchApiKeys: (lessorId: string) => Promise<void>;
  createApiKey: (lessorId: string, name: string) => Promise<ApiKey | null>;
  deleteApiKey: (keyId: string) => Promise<void>;
  revokeApiKey: (keyId: string) => Promise<void>;
  activateApiKey: (keyId: string) => Promise<void>;
}

export const useFriApiKeys = (): UseFriApiKeysReturn => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const escapeSqlValue = (value: string) => value.replace(/'/g, "''");

  const normalizeRows = (response: any) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.recordset)) return response.recordset;
    if (Array.isArray(response.data?.recordset)) return response.data.recordset;
    return response.data ?? response;
  };

  const fetchApiKeys = async (lessorId: string) => {
    try {
      setError(null);
      setLoading(true);

      const safeLessorId = escapeSqlValue(lessorId);
      const response = await azureApi.post<any>('/db/query', {
        query: `SELECT * FROM fri_api_keys WHERE lessor_id='${safeLessorId}' ORDER BY created_at DESC`,
      });

      const rows = normalizeRows(response) as ApiKey[];

      // Mask the full keys
      const maskedKeys = (rows || []).map(k => ({
        ...k,
        key: `sk_live_${k.key.substring(0, 8)}****`,
      }));

      setApiKeys(maskedKeys);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fejl ved indlæsning af API keys';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async (lessorId: string, name: string): Promise<ApiKey | null> => {
    try {
      setError(null);

      // Generate a unique API key
      const fullKey = `sk_live_${generateApiKey()}`;
      const shortKey = generateApiKey();

      await azureApi.post('/db/query', {
        query: `INSERT INTO fri_api_keys (lessor_id, name, key, status) VALUES ('${escapeSqlValue(lessorId)}', '${escapeSqlValue(name)}', '${escapeSqlValue(shortKey)}', 'active')`,
      });

      // Return the full key only on creation
      return {
        id: '',
        lessor_id: lessorId,
        name,
        key: `sk_live_${shortKey.substring(0, 8)}****`,
        full_key: fullKey,
        status: 'active',
        created_at: new Date().toISOString(),
      } as ApiKey;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fejl ved oprettelse af API key';
      setError(message);
      throw err;
    }
  };

  const deleteApiKey = async (keyId: string) => {
    try {
      await azureApi.post('/db/query', {
        query: `DELETE FROM fri_api_keys WHERE id='${escapeSqlValue(keyId)}'`,
      });

      setApiKeys(apiKeys.filter(k => k.id !== keyId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fejl ved sletning';
      setError(message);
      throw err;
    }
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      await azureApi.post('/db/query', {
        query: `UPDATE fri_api_keys SET status='inactive' WHERE id='${escapeSqlValue(keyId)}'`,
      });

      setApiKeys(apiKeys.map(k =>
        k.id === keyId ? { ...k, status: 'inactive' } : k
      ));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fejl ved tilbagekald';
      setError(message);
      throw err;
    }
  };

  const activateApiKey = async (keyId: string) => {
    try {
      await azureApi.post('/db/query', {
        query: `UPDATE fri_api_keys SET status='active' WHERE id='${escapeSqlValue(keyId)}'`,
      });

      setApiKeys(apiKeys.map(k =>
        k.id === keyId ? { ...k, status: 'active' } : k
      ));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fejl ved aktivering';
      setError(message);
      throw err;
    }
  };

  return {
    apiKeys,
    loading,
    error,
    fetchApiKeys,
    createApiKey,
    deleteApiKey,
    revokeApiKey,
    activateApiKey,
  };
};
