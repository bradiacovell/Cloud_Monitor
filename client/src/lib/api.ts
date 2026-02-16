import axios from 'axios';
import type { Provider, ProviderStatus, Incident } from '../types/status';

const PROVIDERS_CONFIG = [
  {
    id: 'gcp',
    name: 'Google Cloud Platform',
    description: 'Compute, Storage, Networking',
    url: 'https://status.cloud.google.com/',
    apiUrl: 'https://status.cloud.google.com/incidents.json',
    type: 'google' as const,
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Gmail, Drive, Meet, Calendar',
    url: 'https://www.google.com/appsstatus/dashboard/',
    apiUrl: 'https://www.google.com/appsstatus/dashboard/incidents.json',
    type: 'google' as const,
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'CDN, DNS, DDoS Protection',
    url: 'https://www.cloudflarestatus.com/',
    apiUrl: 'https://www.cloudflarestatus.com/api/v2/summary.json',
    type: 'statuspage' as const,
  },
  {
    id: 'datadog',
    name: 'Datadog',
    description: 'Monitoring & Analytics',
    url: 'https://status.datadoghq.com/',
    apiUrl: 'https://status.datadoghq.com/api/v2/summary.json',
    type: 'statuspage' as const,
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Git, Actions, Packages',
    url: 'https://www.githubstatus.com/',
    apiUrl: 'https://www.githubstatus.com/api/v2/summary.json',
    type: 'statuspage' as const,
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'CRM & Cloud Services',
    url: 'https://status.salesforce.com/',
    apiUrl: 'https://api.status.salesforce.com/v1/incidents/active',
    type: 'salesforce' as const,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team Communication',
    url: 'https://slack-status.com/',
    apiUrl: 'https://slack-status.com/api/v2.0.0/current',
    type: 'slack' as const,
  },
  {
    id: 'atlassian',
    name: 'Atlassian',
    description: 'Jira, Confluence, Bitbucket',
    url: 'https://status.atlassian.com/',
    apiUrl: 'https://status.atlassian.com/api/v2/summary.json',
    type: 'statuspage' as const,
  },
  {
    id: 'aws',
    name: 'Amazon Web Services',
    description: 'EC2, S3, Lambda, RDS',
    url: 'https://health.aws.amazon.com/',
    apiUrl: 'https://status.aws.amazon.com/rss/all.rss',
    type: 'rss' as const,
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    description: 'Compute, Storage, AI',
    url: 'https://azure.status.microsoft/en-us/status',
    apiUrl: 'https://rssfeed.azure.status.microsoft/en-us/status/feed/',
    type: 'rss' as const,
  },
];

function parseStatusPageResponse(data: any): { status: ProviderStatus; incidents: Incident[] } {
  const indicator = data.status?.indicator || 'none';
  let status: ProviderStatus = 'operational';
  
  if (indicator === 'critical' || indicator === 'major') {
    status = 'major_outage';
  } else if (indicator === 'minor') {
    status = 'degraded';
  } else if (data.incidents?.length > 0) {
    status = 'partial_outage';
  }

  const incidents: Incident[] = (data.incidents || []).slice(0, 5).map((inc: any) => ({
    id: inc.id,
    name: inc.name,
    status: inc.status,
    impact: inc.impact,
    created_at: inc.created_at,
    updated_at: inc.updated_at,
    shortlink: inc.shortlink,
    incident_updates: inc.incident_updates,
  }));

  return { status, incidents };
}

function parseGoogleResponse(data: any): { status: ProviderStatus; incidents: Incident[] } {
  const recentIncidents = (data || []).slice(0, 5);
  let status: ProviderStatus = 'operational';
  
  if (recentIncidents.length > 0) {
    const hasActive = recentIncidents.some((inc: any) => 
      inc.updates?.[0]?.status !== 'AVAILABLE'
    );
    if (hasActive) {
      status = 'partial_outage';
    }
  }

  const incidents: Incident[] = recentIncidents.map((inc: any) => ({
    id: inc.id,
    name: inc.external_desc || 'Incident',
    status: inc.updates?.[0]?.status || 'unknown',
    impact: inc.severity || 'medium',
    created_at: inc.begin || inc.created,
    updated_at: inc.modified,
    incident_updates: inc.updates?.map((u: any) => ({
      body: u.text,
      created_at: u.when,
      status: u.status,
    })),
  }));

  return { status, incidents };
}

function parseSalesforceResponse(data: any): { status: ProviderStatus; incidents: Incident[] } {
  const incidents = Array.isArray(data) ? data : [];
  const status: ProviderStatus = incidents.length > 0 ? 'partial_outage' : 'operational';

  const parsedIncidents: Incident[] = incidents.slice(0, 5).map((inc: any) => ({
    id: inc.id?.toString() || '',
    name: inc.message?.incidentTitle || 'Incident',
    status: inc.message?.incidentStatus || 'unknown',
    impact: inc.message?.severity || 'medium',
    created_at: inc.message?.createdDate || '',
    updated_at: inc.message?.updatedDate || '',
  }));

  return { status, incidents: parsedIncidents };
}

function parseSlackResponse(data: any): { status: ProviderStatus; incidents: Incident[] } {
  const status: ProviderStatus = data.status === 'ok' ? 'operational' : 'degraded';
  const incidents: Incident[] = (data.active_incidents || []).slice(0, 5).map((inc: any) => ({
    id: inc.id?.toString() || '',
    name: inc.title || 'Incident',
    status: inc.status || 'investigating',
    impact: inc.type || 'incident',
    created_at: inc.date_created || '',
    updated_at: inc.date_updated || '',
  }));

  return { status, incidents };
}

async function fetchProviderStatus(config: typeof PROVIDERS_CONFIG[0]): Promise<Provider> {
  try {
    const response = await axios.get(config.apiUrl, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
      },
    });

    let status: ProviderStatus = 'operational';
    let incidents: Incident[] = [];

    switch (config.type) {
      case 'statuspage':
        ({ status, incidents } = parseStatusPageResponse(response.data));
        break;
      case 'google':
        ({ status, incidents } = parseGoogleResponse(response.data));
        break;
      case 'salesforce':
        ({ status, incidents } = parseSalesforceResponse(response.data));
        break;
      case 'slack':
        ({ status, incidents } = parseSlackResponse(response.data));
        break;
      case 'rss':
        // RSS feeds would need server-side parsing
        status = 'operational';
        incidents = [];
        break;
    }

    return {
      ...config,
      status,
      incidents,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching ${config.name}:`, error);
    return {
      ...config,
      status: 'unknown',
      incidents: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

export async function fetchAllProviders(): Promise<Provider[]> {
  const results = await Promise.allSettled(
    PROVIDERS_CONFIG.map(config => fetchProviderStatus(config))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        ...PROVIDERS_CONFIG[index],
        status: 'unknown' as ProviderStatus,
        incidents: [],
        lastUpdated: new Date().toISOString(),
      };
    }
  });
}

export function generateRSSFeed(providers: Provider[]): string {
  const items = providers
    .flatMap(provider => 
      provider.incidents.map(incident => ({
        provider: provider.name,
        incident,
      }))
    )
    .sort((a, b) => 
      new Date(b.incident.updated_at).getTime() - new Date(a.incident.updated_at).getTime()
    )
    .slice(0, 50);

  const rssItems = items.map(({ provider, incident }) => `
    <item>
      <title>${provider}: ${incident.name}</title>
      <description>${incident.status} - Impact: ${incident.impact}</description>
      <pubDate>${new Date(incident.updated_at).toUTCString()}</pubDate>
      <guid isPermaLink="false">${incident.id}</guid>
      ${incident.shortlink ? `<link>${incident.shortlink}</link>` : ''}
    </item>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Cloud Status Monitor</title>
    <description>Real-time monitoring of major cloud provider incidents and outages</description>
    <link>https://cloudstatus.monitor</link>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${rssItems}
  </channel>
</rss>`;
}
