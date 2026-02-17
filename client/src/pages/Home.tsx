/* Design: Technical Clarity - Dark theme with asymmetric layout, status-driven colors */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Rss, Download } from 'lucide-react';
import { StatusOverview } from '@/components/StatusOverview';
import { ProviderCard } from '@/components/ProviderCard';
import { fetchAllProviders, generateRSSFeed } from '@/lib/api';
import type { Provider } from '@/types/status';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

export default function Home() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const trpcUtils = trpc.useUtils();

  const loadProviders = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const data = await fetchAllProviders(trpcUtils);
      setProviders(data);
      if (showToast) {
        toast.success('Status updated successfully');
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      toast.error('Failed to load provider status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProviders();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      loadProviders();
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    loadProviders(true);
  };

  const handleDownloadRSS = () => {
    const rss = generateRSSFeed(providers);
    const blob = new Blob([rss], { type: 'application/rss+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cloud-status-feed.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('RSS feed downloaded');
  };

  const handleCopyRSSLink = () => {
    // In a real deployment, this would be the actual RSS endpoint URL
    const rssUrl = `${window.location.origin}/api/rss`;
    navigator.clipboard.writeText(rssUrl);
    toast.success('RSS feed URL copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-md sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Cloud Status Monitor</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time monitoring of major cloud providers
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyRSSLink}
                className="gap-2"
              >
                <Rss className="w-4 h-4" />
                Copy RSS URL
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadRSS}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download Feed
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading provider status...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Status Overview */}
            <StatusOverview providers={providers} />

            {/* Provider Grid */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Service Providers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            </div>

            {/* Footer Info */}
            <div className="text-center py-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Monitoring {providers.length} cloud providers • Auto-refreshes every 2 minutes
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Data sourced from official status pages and APIs
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
