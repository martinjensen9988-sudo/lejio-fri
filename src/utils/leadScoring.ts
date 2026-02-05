interface SalesLead {
  id: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  cvr_number?: string;
  industry?: string;
  last_contacted_at?: string;
  status: 'new' | 'contacted' | 'interested' | 'qualified';
  source: string;
  [key: string]: string | undefined | number;
}

export const calculateLeadScore = (lead: SalesLead): number => {
  let score = 0;

  // Contact completeness (30 points max)
  if (lead.contact_name) score += 10;
  if (lead.contact_email) score += 10;
  if (lead.contact_phone) score += 10;

  // Business info (20 points max)
  if (lead.cvr_number) score += 10;
  if (lead.industry) score += 10;

  // Recent activity (25 points max)
  if (lead.last_contacted_at) {
    const daysSinceContact = Math.floor(
      (new Date().getTime() - new Date(lead.last_contacted_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (daysSinceContact <= 3) score += 25;
    else if (daysSinceContact <= 7) score += 15;
    else if (daysSinceContact <= 30) score += 5;
  }

  // Status weighting (25 points max)
  switch (lead.status) {
    case 'qualified':
      score += 25;
      break;
    case 'contacted':
      score += 15;
      break;
    case 'interested':
      score += 20;
      break;
    case 'new':
      score += 5;
      break;
  }

  return Math.min(score, 100); // Max 100 points
};

// Helper to get top sources
export function getTopSources(
  leads: SalesLead[]
): [string, number][] {
  const sourceMap = new Map<string, number>();
  leads.forEach((lead) => {
    sourceMap.set(lead.source, (sourceMap.get(lead.source) || 0) + 1);
  });
  return Array.from(sourceMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}
