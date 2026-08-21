# RideFlow

RideFlow is a full-stack ride-hailing application prototype with customer and driver experiences, server-side fare quotes, a transparent 5% platform commission, profile and driver-document storage, admin controls, and database-backed settings.

## Portable self-hosting

This repository is prepared for self-hosting. It keeps the React frontend, Express/tRPC server, Drizzle schema and migrations, tests, and provider contracts while removing Manus-only Vite/debug/storage modules. Configure your own MySQL/TiDB-compatible database, S3-compatible private storage, OIDC provider, notification adapter, domain, HTTPS, backups, and monitoring.

Read [the new database and self-hosting guide](docs/rideflow-new-database-guide.md) before changing infrastructure. The guide explains database creation, migrations, environment variables, private file storage, OIDC login, notifications, data migration, backups, and production gaps.

The [deployment, Stripe, and Daraja guide](docs/rideflow-deployment-payments-guide.md) explains servers, databases, storage, OIDC, Stripe Connect, M-Pesa Daraja, webhooks, secrets, backups, and launch checks.

The [complete codebase and maintenance guide](docs/rideflow-complete-code-guide.md) maps the folders and files, explains request flow, database and fare logic, admin controls, payment scaffolding, and how to update the project safely.

The broader [engineering handbook](docs/rideflow-engineering-handbook.md) explains the architecture, codebase, rider/driver data model, server flow, security, testing, payments, realtime rides, operations, and learning roadmap.

## Local development

```bash
pnpm install
pnpm check
pnpm test
pnpm dev
```

Copy the documented environment variables into a local `.env` file. Never commit `.env`, database dumps, private keys, storage credentials, payment secrets, identity documents, or production logs.

## Production build

```bash
pnpm check
pnpm test
pnpm build
NODE_ENV=production pnpm start
```

Before accepting real riders or payments, complete provider onboarding, maps and dispatch, realtime location, payment authorization, driver payouts, legal review, support operations, backups, monitoring, and incident-response procedures.
