# Free hosting research notes

## Render official free instances
Source: https://render.com/docs/free

Key current findings gathered on Aug 21, 2026: Render says free instances are intended for testing/hobby/preview rather than production. Free web services spin down after 15 minutes without inbound traffic, including HTTP requests and WebSocket messages; wake-up can take about one minute. The filesystem is ephemeral and local uploads or SQLite data are lost on restart/redeploy/spin-down. Free Postgres databases expire 30 days after creation. Render grants 750 free instance hours per workspace per calendar month; exhausting the allowance suspends free web services until the next month. Free services can be restarted at any time and cannot scale beyond one instance, use persistent disks, use SSH/shell access, or receive private-network traffic. Free services can send outbound requests to external databases and APIs, subject to service-initiated-traffic limits. Free services cannot send SMTP traffic on ports 25, 465, or 587.

## Other official sources to use
- Stripe test use cases: https://docs.stripe.com/testing-use-cases
- Stripe webhooks: https://docs.stripe.com/webhooks
- Safaricom Daraja simulator: https://developer.safaricom.co.ke/apis/MpesaExpressSimulate
- MDN WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API

## Supabase official pricing
Source: https://supabase.com/pricing

Key current findings gathered on Aug 21, 2026: Free plan is $0/month and includes unlimited API requests, 50,000 monthly active users, 500 MB database size with shared CPU/500 MB RAM, 5 GB egress, 5 GB cached egress, 1 GB file storage, and community support. Free projects are paused after one week of inactivity and the free plan is limited to two active projects. Free does not include automatic backups; daily backups for seven or fourteen days are listed for higher plans. This makes Supabase useful for a prototype database/storage companion, but not a safe sole production backup without an external backup process.

## Aiven for MySQL free tier
Source: https://aiven.io/docs/products/mysql/concepts/mysql-free-tier

Key current findings gathered on Aug 21, 2026: Aiven states its free MySQL tier requires no credit card and can be used indefinitely. It includes one single-node service, 1 CPU, 1 GB RAM, 1 GB disk, metrics/log monitoring, and backups. Limitations include no VPC, no static IP, no integrations/forking, max_connections 76, no support service, one service of each type per organization, and no 99.99% SLA. Aiven may power off a free service with no initial or continued activity, with notification before continued-inactivity shutdown.

## Render web services
Source: https://render.com/docs/web-services

Key current findings gathered on Aug 21, 2026: Render web services support Node.js/Express and deploy from a linked Git branch. The service must bind to host 0.0.0.0 and the PORT environment variable; Render’s default expected port is 10000, but PORT can be configured. Each service receives an onrender.com subdomain and can use a custom domain.
