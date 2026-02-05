// DEPRECATED - Use Azure client instead (src/integrations/azure/client.ts)
// This file is kept for backwards compatibility only - all exports are no-ops

// Type-safe query helpers (deprecated - use Azure client)
export const safeQuerySingle = async <T>(
  query: Promise<{ data: T[] | null; error: unknown }>
): Promise<{ data: T | null; error: unknown }> => {
  console.warn('safeQuerySingle is deprecated - use Azure client');
  const { data, error } = await query;
  return {
    data: data?.[0] ?? null,
    error,
  };
};

export const safeQueryMany = async <T>(
  query: Promise<{ data: T[] | null; error: unknown }>
): Promise<{ data: T[]; error: unknown }> => {
  console.warn('safeQueryMany is deprecated - use Azure client');
  const { data, error } = await query;
  return {
    data: data ?? [],
    error,
  };
};

// Null-safe mutations (deprecated)
export const safeMutation = async <T>(
  mutation: Promise<{ data: T | null; error: unknown }>
): Promise<{ data: T | null; error: unknown }> => {
  console.warn('safeMutation is deprecated - use Azure client');
  return mutation;
};

// Type-safe RLS helpers (deprecated)
export const withUserId = (userId: string) => ({
  eq: (field: string) => ({
    field,
    operator: 'eq',
    value: userId,
  }),
});
