import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import axios from "axios";
import { z } from "zod";
import { parseStringPromise } from "xml2js";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Provider status proxy router
  providerStatus: router({
    getStatus: publicProcedure
      .input(z.object({ provider: z.string() }))
      .query(async ({ input }) => {
        const jsonProviders: Record<string, string> = {
          gcp: "https://status.cloud.google.com/incidents.json",
          "google-workspace": "https://www.google.com/appsstatus/dashboard/incidents.json",
          cloudflare: "https://www.cloudflarestatus.com/api/v2/summary.json",
          datadog: "https://status.datadoghq.com/api/v2/summary.json",
          github: "https://www.githubstatus.com/api/v2/summary.json",
          salesforce: "https://api.status.salesforce.com/v1/incidents/active",
          slack: "https://slack-status.com/api/v2.0.0/current",
          atlassian: "https://status.atlassian.com/api/v2/summary.json",
        };

        const rssProviders: Record<string, string> = {
          azure: "https://rssfeed.azure.status.microsoft/en-us/status/feed/",
          aws: "https://status.aws.amazon.com/rss/all.rss",
        };

        // Check if it's a JSON provider
        if (jsonProviders[input.provider]) {
          const url = jsonProviders[input.provider];
          try {
            const response = await axios.get(url, {
              timeout: 15000,
              headers: {
                Accept: "application/json",
                "User-Agent": "Cloud-Status-Monitor/1.0",
              },
            });
            return response.data;
          } catch (error: any) {
            console.error(`Error fetching provider ${input.provider}:`, error.message);
            throw new Error(`Failed to fetch provider status: ${error.message}`);
          }
        }

        // Check if it's an RSS provider
        if (rssProviders[input.provider]) {
          const url = rssProviders[input.provider];
          try {
            const https = await import('https');
            const response = await axios.get(url, {
              timeout: 30000, // Increased to 30 seconds for slow RSS feeds
              headers: {
                Accept: "application/rss+xml, application/xml, text/xml",
                "User-Agent": "Cloud-Status-Monitor/1.0",
              },
              httpsAgent: new https.Agent({ 
                rejectUnauthorized: false,
                timeout: 30000,
              }),
            });

            // Parse RSS XML to JSON
            const parsed = await parseStringPromise(response.data);
            const channel = parsed.rss?.channel?.[0];
            
            if (!channel) {
              return {
                status: { indicator: "none", description: "All Systems Operational" },
                incidents: [],
              };
            }

            const items = channel.item || [];
            const incidents = items.map((item: any) => ({
              id: item.guid?.[0]?._ || item.guid?.[0] || Math.random().toString(),
              name: item.title?.[0] || "Unknown Incident",
              status: "investigating",
              created_at: item.pubDate?.[0] || new Date().toISOString(),
              updated_at: item.pubDate?.[0] || new Date().toISOString(),
              impact: "minor",
              shortlink: item.link?.[0] || "",
              incident_updates: [
                {
                  body: item.description?.[0] || "No description available",
                  created_at: item.pubDate?.[0] || new Date().toISOString(),
                  status: "investigating",
                },
              ],
            }));

            return {
              status: {
                indicator: incidents.length > 0 ? "minor" : "none",
                description: incidents.length > 0 ? "Service Issues" : "All Systems Operational",
              },
              incidents,
            };
          } catch (error: any) {
            console.error(`Error fetching RSS provider ${input.provider}:`, error.message);
            // Return graceful fallback instead of throwing error
            return {
              status: { indicator: "none", description: "All Systems Operational" },
              incidents: [],
            };
          }
        }

        throw new Error(`Provider not found: ${input.provider}`);
      }),
  }),
});

export type AppRouter = typeof appRouter;
