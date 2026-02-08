// Lejio Fri API Client
// Clean API client for PostgreSQL backend on Render

const rawApiUrl = import.meta.env.VITE_API_URL || "/api";
const normalizedApiUrl = rawApiUrl.replace(/\/+$/, "");
const API_URL = normalizedApiUrl.endsWith("/api") ? normalizedApiUrl : `${normalizedApiUrl}/api`;

// Standalone API request function
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`API Error: ${response.status} - ${error.message || error.error || response.statusText}`);
  }

  return response.json();
}

// API Client for communication with Azure Functions backend
export const azureApi = {
  request: apiRequest,

  async get<T>(endpoint: string) {
    return apiRequest<T>(endpoint, { method: "GET" });
  },

  async post<T>(endpoint: string, data?: any) {
    return apiRequest<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async put<T>(endpoint: string, data?: any) {
    return apiRequest<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async patch<T>(endpoint: string, data?: any) {
    return apiRequest<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async delete<T>(endpoint: string) {
    return apiRequest<T>(endpoint, { method: "DELETE" });
  },
};

// Configuration export
export const azureConfig = {
  apiUrl: API_URL,
};

// Proxy for backwards compatibility — returns empty data for unmigrated features
// These hooks will be rewritten to use azureApi.post('/db-query', ...) as features are built
const notImplemented = (feature: string) => {
  if (import.meta.env.DEV) console.warn(`[lejio] Feature not yet migrated: ${feature}`);
  return { data: null, error: new Error(`Not implemented: ${feature}`) };
};

const emptyResult = { data: [], error: null };
const nullResult = { data: null, error: null };

export const supabase = {
  from: (table: string) => {
    const chainable = {
      select: (_cols = '*', _options?: any) => ({
        eq: (_field: string, _value: any) => Promise.resolve(emptyResult),
        neq: (_field: string, _value: any) => Promise.resolve(emptyResult),
        gt: (_field: string, _value: any) => Promise.resolve(emptyResult),
        gte: (_field: string, _value: any) => Promise.resolve(emptyResult),
        lt: (_field: string, _value: any) => Promise.resolve(emptyResult),
        lte: (_field: string, _value: any) => Promise.resolve(emptyResult),
        in: (_field: string, _values: any[]) => Promise.resolve(emptyResult),
        or: (_filter: string) => Promise.resolve(emptyResult),
        order: (_col: string, _opts?: any) => Promise.resolve(emptyResult),
        limit: (_n: number) => Promise.resolve(emptyResult),
        single: () => Promise.resolve(nullResult),
        maybeSingle: () => Promise.resolve(nullResult),
        then: (onFulfilled: any) => Promise.resolve(emptyResult).then(onFulfilled),
      }),
      insert: (_data: any) => ({
        select: () => Promise.resolve(nullResult),
        then: (onFulfilled?: any) => onFulfilled ? Promise.resolve(nullResult).then(onFulfilled) : Promise.resolve(nullResult),
      }),
      update: (_data: any) => ({
        eq: (_f: string, _v: any) => ({
          select: () => Promise.resolve(nullResult),
          then: (onFulfilled?: any) => onFulfilled ? Promise.resolve(nullResult).then(onFulfilled) : Promise.resolve(nullResult),
        }),
      }),
      upsert: (_data: any) => ({
        select: () => Promise.resolve(nullResult),
        then: (onFulfilled?: any) => onFulfilled ? Promise.resolve(nullResult).then(onFulfilled) : Promise.resolve(nullResult),
      }),
      delete: () => ({
        eq: (_f: string, _v: any) => ({
          then: (onFulfilled?: any) => onFulfilled ? Promise.resolve(nullResult).then(onFulfilled) : Promise.resolve(nullResult),
        }),
      }),
    };
    return chainable;
  },

  rpc: (_functionName: string, _params?: any) => Promise.resolve(nullResult),

  functions: {
    invoke: (_name: string, _options?: any) => Promise.resolve({ data: null, error: new Error('Not implemented') }),
  },

  storage: {
    from: (_bucket: string) => ({
      upload: (_path: string, _file: any) => Promise.resolve(nullResult),
      getPublicUrl: (path: string) => ({ data: { publicUrl: `/storage/${_bucket}/${path}` } }),
      download: (_path: string) => Promise.resolve(nullResult),
    })
  },

  auth: {
    getUser: async () => {
      try {
        const response: any = await azureApi.get('/auth-session');
        return { data: { user: response.user || null }, error: null };
      } catch { return { data: { user: null }, error: null }; }
    },
    getSession: async () => {
      try {
        const response: any = await azureApi.get('/auth-session');
        return { data: { session: response.user ? { user: response.user } : null }, error: null };
      } catch { return { data: { session: null }, error: null }; }
    },
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      try {
        const response: any = await azureApi.post('/auth-login', credentials);
        return { data: { user: response.user, session: { user: response.user } }, error: null };
      } catch (error: any) { return { data: null, error }; }
    },
    signInWithOAuth: async (_options: { provider: string; options?: any }) => notImplemented('OAuth'),
    signUp: async (credentials: { email: string; password: string }) => {
      try {
        const response: any = await azureApi.post('/auth-signup', credentials);
        return { data: { user: response.user, session: { user: response.user } }, error: null };
      } catch (error: any) { return { data: null, error }; }
    },
    signOut: async () => {
      try { await azureApi.post('/auth-logout', {}); return { error: null }; }
      catch (error: any) { return { error }; }
    },
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      azureApi.get('/auth-session').then((response: any) => {
        callback('INITIAL_SESSION', response.user ? { user: response.user } : null);
      }).catch(() => { callback('INITIAL_SESSION', null); });
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },

  channel: (_channelName: string) => ({
    on: (_event: string, _opts: any, _callback?: any) => ({
      on: (_e2: string, _o2: any, _c2?: any) => ({
        subscribe: (cb?: (status: string) => void) => { if (cb) cb('SUBSCRIBED'); return { unsubscribe: () => {} }; }
      }),
      subscribe: (cb?: (status: string) => void) => { if (cb) cb('SUBSCRIBED'); return { unsubscribe: () => {} }; }
    }),
    subscribe: (cb?: (status: string) => void) => { if (cb) cb('SUBSCRIBED'); return { unsubscribe: () => {} }; }
  }),
  removeChannel: (_sub: any) => ({ data: null }),
};

export default azureApi;