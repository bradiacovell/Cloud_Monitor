export type ProviderStatus = 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'unknown';

export interface Incident {
  id: string;
  name: string;
  status: string;
  impact: string;
  created_at: string;
  updated_at: string;
  shortlink?: string;
  incident_updates?: Array<{
    body: string;
    created_at: string;
    status: string;
  }>;
}

export interface Provider {
  id: string;
  name: string;
  status: ProviderStatus;
  description: string;
  url: string;
  apiUrl: string;
  type: 'statuspage' | 'google' | 'salesforce' | 'slack' | 'rss';
  incidents: Incident[];
  lastUpdated: string;
}

export interface StatusSummary {
  indicator: string;
  description: string;
}
