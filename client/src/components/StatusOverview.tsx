/* Design: Technical Clarity - Prominent status summary with metrics */
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, AlertCircle, XCircle } from 'lucide-react';
import type { Provider } from '../types/status';

interface StatusOverviewProps {
  providers: Provider[];
}

export function StatusOverview({ providers }: StatusOverviewProps) {
  const operational = providers.filter(p => p.status === 'operational').length;
  const degraded = providers.filter(p => p.status === 'degraded').length;
  const partialOutage = providers.filter(p => p.status === 'partial_outage').length;
  const majorOutage = providers.filter(p => p.status === 'major_outage').length;
  const unknown = providers.filter(p => p.status === 'unknown').length;

  const totalIncidents = providers.reduce((sum, p) => sum + p.incidents.length, 0);
  const allOperational = operational === providers.length;

  return (
    <Card className="border-2 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Main Status */}
          <div className="text-center">
            {allOperational ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-foreground">All Systems Operational</h2>
                <p className="text-muted-foreground mt-2">
                  All monitored services are running normally
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-pulse-glow" />
                <h2 className="text-3xl font-bold text-foreground">Service Disruptions Detected</h2>
                <p className="text-muted-foreground mt-2">
                  {totalIncidents} active incident{totalIncidents !== 1 ? 's' : ''} across monitored services
                </p>
              </>
            )}
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-500">{operational}</div>
              <div className="text-xs text-muted-foreground mt-1">Operational</div>
            </div>

            <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-500">{degraded}</div>
              <div className="text-xs text-muted-foreground mt-1">Degraded</div>
            </div>

            <div className="text-center p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <AlertCircle className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-500">{partialOutage}</div>
              <div className="text-xs text-muted-foreground mt-1">Partial</div>
            </div>

            <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-500">{majorOutage}</div>
              <div className="text-xs text-muted-foreground mt-1">Major</div>
            </div>

            <div className="text-center p-4 rounded-lg bg-gray-500/10 border border-gray-500/20">
              <AlertCircle className="w-6 h-6 text-gray-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-500">{unknown}</div>
              <div className="text-xs text-muted-foreground mt-1">Unknown</div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-center text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
