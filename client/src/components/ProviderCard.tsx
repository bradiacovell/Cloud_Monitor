/* Design: Technical Clarity - Glass-morphism card with status indicators */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, AlertCircle, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { Provider } from '../types/status';

interface ProviderCardProps {
  provider: Provider;
}

const statusConfig = {
  operational: {
    icon: CheckCircle,
    label: 'Operational',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
  degraded: {
    icon: AlertTriangle,
    label: 'Degraded',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
  },
  partial_outage: {
    icon: AlertCircle,
    label: 'Partial Outage',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
  },
  major_outage: {
    icon: XCircle,
    label: 'Major Outage',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
  },
  unknown: {
    icon: AlertCircle,
    label: 'Unknown',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
  },
};

export function ProviderCard({ provider }: ProviderCardProps) {
  const config = statusConfig[provider.status];
  const StatusIcon = config.icon;
  const hasIncidents = provider.incidents.length > 0;

  return (
    <Card className={`relative overflow-hidden border-2 ${config.borderColor} bg-card/50 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-lg`}>
      {hasIncidents && (
        <div className={`absolute top-0 right-0 w-2 h-2 ${config.bgColor} rounded-full m-3 animate-pulse-glow`} />
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {provider.name}
              <a
                href={provider.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {provider.description}
            </CardDescription>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} border ${config.borderColor}`}>
            <StatusIcon className={`w-4 h-4 ${config.color}`} />
            <span className={`text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          </div>
        </div>
      </CardHeader>

      {hasIncidents && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Recent Incidents
            </h4>
            <div className="space-y-2">
              {provider.incidents.slice(0, 3).map((incident) => (
                <div
                  key={incident.id}
                  className="p-3 rounded-lg bg-muted/50 border border-border/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {incident.name}
                    </p>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {incident.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(incident.updated_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}

      {!hasIncidents && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            No recent incidents reported
          </p>
        </CardContent>
      )}
    </Card>
  );
}
