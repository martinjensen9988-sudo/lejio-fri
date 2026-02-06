import { useState } from 'react';
import { azureApi } from '@/integrations/azure/client';

const generateApiKey = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

export interface ApiKey {
  id: string;
  lessor_id: string;
  name: string;
  key: string;
  full_key?: string;
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

const esc = (v: string) => v.replace(/'/g, "''");

const normalizeRows = (response: any) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.recordset)) return response.recordset;
  if (Array.isArray(response.data?.recordset)) return response.data.recordset;
  return response.data ?? response;
};

export const useFriApiKeys = (): UseFriApiKeysReturn => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKeys = async (lessorId: string) => {
    try {
      setError(null);
      setLoading(true);
      const response = await azureApi.post<any>('/db-query', {
        query: `SELECT * FROM fri_api_keys WHERE lessor_id='${esc(lessorId)}' ORDER BY created_at DESC`,
      });
      const rows = normalizeRows(response) as ApiKey[];
      setApiKeys((rows || []).map(k => ({ ...k, key: `sk_live_${k.key.substring(0, 8)}****` })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fejl ved indlæsning af API keys');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async (lessorId: string, name: string): Promise<ApiKey | null> => {
    try {
      setError(null);
      const fullKey = `sk_live_${generateApiKey()}`;
      const shortKey = generateApiKey();
      await azureApi.post('/db-query', {
        query: `INSERT INTO fri_api_keys (lessor_id, name, key, status) VALUES ('${esc(lessorId)}', '${esc(name)}', '${esc(shortKey)}', 'active')`,
      });
      return { id: '', lessor_id: lessorId, name, key: `sk_live_${shortKey.substring(0, 8)}****`, full_key: fullKey, status: 'active', created_at: new Date().toISOString() };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fejl ved oprettelse af API key');
      throw err;
    }
  };

  const deleteApiKey = async (keyId: string) => {
    try {
      await azureApi.post('/db-query', { query: `DELETE FROM fri_api_keys WHERE id='${esc(keyId)}'` });
      setApiKeys(prev => prev.filter(k => k.id !== keyId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fejl ved sletning');
      throw err;
    }
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      await azureApi.post('/db-query', { query: `UPDATE fri_api_keys SET status='inactive' WHERE id='${esc(keyId)}'` });
      setApiKeys(prev => prev.map(k => k.id === keyId ? { ...k, status: 'inactive' as const } : k));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fejl ved tilbagekald');
      throw err;
    }
  };

  const activateApiKey = async (keyId: string) => {
    try {
      await azureApi.post('/db-query', { query: `UPDATE fri_api_keys SET status='active' WHERE id='${esc(keyId)}'` });
      setApiKeys(prev => prev.map(k => k.id === keyId ? { ...k, status: 'active' as const } : k));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fejl ved aktivering');
      throw err;
    }
  };

  return { apiKeys, loading, error, fetchApiKeys, createApiKey, deleteApiKey, revokeApiKey, activateApiKey };
};
