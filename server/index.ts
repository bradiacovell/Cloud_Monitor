import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // API proxy endpoints for provider status
  app.get("/api/status/:provider", async (req, res) => {
    try {
      const { provider } = req.params;
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

      const url = providers[provider];
      if (!url) {
        return res.status(404).json({ error: "Provider not found" });
      }

      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          Accept: "application/json",
          "User-Agent": "Cloud-Status-Monitor/1.0",
        },
      });

      res.json(response.data);
    } catch (error) {
      console.error(`Error fetching provider ${req.params.provider}:`, error);
      res.status(500).json({
        error: "Failed to fetch provider status",
        provider: req.params.provider,
      });
    }
  });

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "healthy" });
  });

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
