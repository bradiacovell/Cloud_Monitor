import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import axios from "axios";
import { z } from "zod";

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
        const providers: Record<string, string> = {
          gcp: "https://status.cloud.google.com/incidents.json",
          "google-workspace": "https://www.google.com/appsstatus/dashboard/incidents.json",
          cloudflare: "https://www.cloudflarestatus.com/api/v2/summary.json",
          datadog: "https://status.datadoghq.com/api/v2/summary.json",
          github: "https://www.githubstatus.com/api/v2/summary.json",
          salesforce: "https://api.status.salesforce.com/v1/incidents/active",
          slack: "https://slack-status.com/api/v2.0.0/current",
          atlassian: "https://status.atlassian.com/api/v2/summary.json",
          aws: "https://status.aws.amazon.com/api/v2/summary.json",
          azure: "https://azure.status.microsoft/en-us/status/api/v2/summary.json",
        };

        const url = providers[input.provider];
        if (!url) {
          throw new Error(`Provider not found: ${input.provider}`);
        }

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
      }),
  }),
});

export type AppRouter = typeof appRouter;
