# Cloud Status Monitor TODO

## Completed Features
- [x] Initial project setup with tRPC backend
- [x] Frontend dashboard with provider cards
- [x] Status overview component
- [x] RSS feed generation
- [x] Auto-refresh functionality
- [x] Backend proxy for CORS handling
- [x] Deployment to DigitalOcean
- [x] Nginx configuration
- [x] Working status for 8 providers (GCP, Google Workspace, Cloudflare, Datadog, GitHub, Salesforce, Slack, Atlassian)

## In Progress

## Recently Completed
- [x] Fix AWS status API endpoint (now using RSS feed)
- [x] Fix Azure status API endpoint (now using RSS feed with SSL fix)

## Future Enhancements
- [ ] Add Slack webhook notifications for new incidents
- [ ] Historical incident tracking with database
- [ ] Trend charts for uptime statistics
- [ ] Custom filtering by provider or severity

## Bug Fixes
- [x] Fix Azure RSS feed timeout issue (increased timeout to 30s and added graceful fallback)
