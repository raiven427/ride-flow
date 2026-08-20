# RideFlow self-hosting configuration

This document lists the environment variables required when running RideFlow on your own server. Store real values in your hosting provider’s secret manager or in a local `.env` file that is excluded by `.gitignore`. Never commit real credentials to GitHub.

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://rideflow_user:replace-me@127.0.0.1:3306/rideflow
JWT_SECRET=generate-a-long-random-secret

# Replace the current identity provider with your own OAuth/OIDC service.
OAUTH_ISSUER_URL=https://your-identity-provider.example.com
OAUTH_TOKEN_URL=https://your-identity-provider.example.com/oauth/token
OAUTH_USERINFO_URL=https://your-identity-provider.example.com/oauth/userinfo
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_CLIENT_SECRET=your-oauth-client-secret
VITE_OAUTH_AUTHORIZE_URL=https://your-identity-provider.example.com/oauth/authorize
VITE_OAUTH_CLIENT_ID=your-oauth-client-id
VITE_OAUTH_SCOPE=openid profile email

# S3-compatible private object storage.
S3_BUCKET=rideflow-private
S3_REGION=auto
S3_ENDPOINT=https://your-s3-endpoint.example.com
S3_ACCESS_KEY_ID=your-storage-access-key
S3_SECRET_ACCESS_KEY=your-storage-secret
S3_FORCE_PATH_STYLE=false
S3_PUBLIC_BASE_URL=
S3_SIGNED_URL_TTL_SECONDS=900
S3_SERVER_SIDE_ENCRYPTION=

# Signup notifications.
RIDEFLOW_ADMIN_EMAIL=njengastephen112@gmail.com
NOTIFICATION_PROVIDER_URL=
NOTIFICATION_PROVIDER_TOKEN=

# Add only when the corresponding integration is implemented and approved.
MAPS_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=
```

## Database setup

Create an empty MySQL or TiDB-compatible database and a least-privilege application user. Set `DATABASE_URL` to its connection string. From the project root, install dependencies and generate the migration SQL:

```bash
pnpm install
pnpm drizzle-kit generate
```

Review the generated SQL. Apply it with your database migration process, then verify that the expected tables exist. Do not run destructive `DROP TABLE` statements during migration unless you have a tested backup and an explicit migration plan.

The existing `drizzle/schema.ts` and migration files remain in the repository as the database blueprint. Existing hosted data is not deleted by this code migration. To move data from the current project database to a new database, use a provider-supported export/import procedure and validate row counts and file references after import.

## Storage setup

The portable `server/storage.ts` adapter uses standard S3-compatible APIs. It works with AWS S3, Cloudflare R2, MinIO, Wasabi, and similar services when the endpoint, bucket, region, and credentials are configured. Keep the bucket private. The app stores file metadata in the database and returns signed URLs for authorized access.

Create separate storage credentials for development and production. Limit the production credential to the RideFlow bucket and required object operations. Enable provider-side encryption and lifecycle rules. Do not put uploaded identity documents in `client/public` or in Git.

## Identity and notifications

The current project was scaffolded with Manus OAuth. For independent hosting, register the application with an OAuth/OIDC provider you control or select, set the callback URL to `https://your-domain.example.com/api/oauth/callback`, and replace the identity-provider values above. Test login, logout, callback failure, session expiry, and role authorization before inviting real users.

The signup notification code should be connected to an email provider or notification service that you control. Store its API token server-side. Test a single signup, duplicate login, provider outage, retry behavior, and the notification’s handling of personal information.

## Local commands

```bash
pnpm install
pnpm check
pnpm test
pnpm dev
pnpm build
pnpm start
```

The portable build removes the Manus-only Vite runtime and debug collector. The application server, schema, migrations, tests, and provider contracts remain so you can operate them on your own infrastructure.
