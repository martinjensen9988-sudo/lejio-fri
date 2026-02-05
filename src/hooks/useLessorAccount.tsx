import { azureApi } from '@/integrations/azure/client';

export interface CreateLessorAccountInput {
  user_id: string;
  company_name: string;
  custom_domain: string;
  cvr_number?: string;
  primary_color?: string;
}

/**
 * Create a new lessor account via Azure API
 */
export async function createLessorAccount(input: CreateLessorAccountInput) {
  try {
    return await azureApi.post('/lessor-accounts/create', {
      user_id: input.user_id,
      company_name: input.company_name,
      custom_domain: input.custom_domain,
      cvr_number: input.cvr_number,
      primary_color: input.primary_color || '#0066cc',
    });
  } catch (error) {
    console.error('Error creating lessor account:', error);
    throw error;
  }
}

/**
 * Get lessor account for current user
 */
export async function getLessorAccount(userId: string) {
  try {
    return await azureApi.get(`/lessor-accounts/${userId}`);
  } catch (error) {
    console.error('Error fetching lessor account:', error);
    return null;
  }
}

/**
 * Update lessor account metadata
 */
export async function updateLessorAccount(
  userId: string,
  updates: Partial<CreateLessorAccountInput>
) {
  try {
    return await azureApi.put(`/lessor-accounts/${userId}`, updates);
  } catch (error) {
    console.error('Error updating lessor account:', error);
    throw error;
  }
}
