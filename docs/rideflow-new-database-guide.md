# RideFlow New Database and Self-Hosting Guide

**Purpose:** Move RideFlow from project-hosted infrastructure to a database and server you control without deleting the existing project database.  
**Repository:** https://github.com/raiven427/ride-flow  
**Application:** React + Express + tRPC + Drizzle ORM  
**Supported database family:** MySQL-compatible databases, including MySQL and TiDB

## 1. What this migration changes

The portable RideFlow codebase keeps the application, database schema, migrations, tests, server procedures, and storage contracts. It removes the Manus-only Vite runtime, debug collector, Forge storage client, storage proxy, hosted map proxy, hosted AI/voice modules, and hardcoded hosted image paths. Storage now uses a standard S3-compatible adapter. Authentication now uses a provider-neutral OIDC contract. Notifications use an operator-controlled JSON webhook or email adapter.

The current project database is preserved. This guide does not drop tables or delete rows. A new database starts empty and receives the schema through reviewed migrations. If you need existing data, export it from the old provider and import it into the new database using a tested backup-and-restore process.

## 2. Services you must provide

| Service | Minimum responsibility | Example choices |
|---|---|---|
| Application server | Runs Node.js, Express, tRPC, and the built frontend | VPS, container host, managed Node host |
| Relational database | Stores users, profiles, fares, rides, payments, and ledger records | MySQL, TiDB, compatible managed database |
| Object storage | Stores private photos and driver documents | AWS S3, Cloudflare R2, MinIO, Wasabi |
| Identity provider | Signs users in through OAuth/OIDC | Auth0, Keycloak, Clerk, another OIDC provider |
| Notification adapter | Sends owner signup alerts and operational messages | Email provider, webhook, Slack-compatible service |
| HTTPS and domain | Protects cookies and callback URLs | Caddy, Nginx, managed TLS |
| Monitoring and backups | Detects failures and restores data | Provider monitoring, logs, scheduled backups |

Do not put all services on one unprotected laptop for production. A PC is useful for development and administration; production needs a reachable server, HTTPS, backups, firewall rules, and an update process.

## 3. Install the local toolchain

On a development PC, install Git, Node.js LTS, pnpm, and a code editor. Then clone the private repository:

```bash
git clone https://github.com/raiven427/ride-flow.git
cd ride-flow
pnpm install
pnpm check
pnpm test
```

Run the application locally with `pnpm dev`. The server uses `PORT`, defaulting to 3000. Never commit a populated `.env` file.

## 4. Create your database

Create a database named `rideflow` and a dedicated application user. Do not use the root database account from the application. Grant only the permissions needed to connect, read, insert, update, and run the migration process when you intentionally migrate.

A conceptual MySQL setup is:

```sql
CREATE DATABASE rideflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'rideflow_app'@'%' IDENTIFIED BY 'use-a-long-unique-password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON rideflow.* TO 'rideflow_app'@'%';
FLUSH PRIVILEGES;
```

Use your provider’s secure secret mechanism for the password. Restrict inbound database traffic to the application server. Enable TLS if your provider supports it.

Set the connection string in your local environment:

```dotenv
DATABASE_URL=mysql://rideflow_app:password@database-host:3306/rideflow
```

If the password contains special URL characters, URL-encode it. Confirm that the database host, port, database name, user, and TLS requirements match your provider.

## 5. Create the tables with Drizzle

The schema source is `drizzle/schema.ts`. Existing migration files are the historical database blueprint. For a clean new database, install dependencies, generate the current migration, review it, and apply it through your migration process:

```bash
pnpm install
pnpm drizzle-kit generate
```

Read every generated SQL statement. Confirm that it creates or alters only the intended tables. Apply migrations with the database account approved for migrations. Then verify table names, indexes, foreign keys, and row counts.

Do not delete the existing project database as part of this setup. The new database is independent until you intentionally migrate data. For a data move, create a full database export, restore it into a temporary database, run application checks, compare row counts, and only then plan a cutover.

## 6. Environment configuration

Create a local `.env` file that is ignored by Git. Use the following names and replace every placeholder:

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://rideflow_app:password@127.0.0.1:3306/rideflow
JWT_SECRET=generate-a-long-random-value

# OIDC provider
OAUTH_ISSUER_URL=https://identity.example.com
OAUTH_TOKEN_URL=https://identity.example.com/oauth/token
OAUTH_USERINFO_URL=https://identity.example.com/oauth/userinfo
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret
VITE_OAUTH_AUTHORIZE_URL=https://identity.example.com/oauth/authorize
VITE_OAUTH_CLIENT_ID=your-client-id
VITE_OAUTH_SCOPE=openid profile email

# Private S3-compatible storage
S3_BUCKET=rideflow-private
S3_REGION=auto
S3_ENDPOINT=https://storage.example.com
S3_ACCESS_KEY_ID=storage-access-key
S3_SECRET_ACCESS_KEY=storage-secret
S3_FORCE_PATH_STYLE=false
S3_PUBLIC_BASE_URL=
S3_SIGNED_URL_TTL_SECONDS=900
S3_SERVER_SIDE_ENCRYPTION=

# Signup notifications
RIDEFLOW_ADMIN_EMAIL=njengastephen112@gmail.com
NOTIFICATION_PROVIDER_URL=https://notifications.example.com/rideflow
NOTIFICATION_PROVIDER_TOKEN=notification-secret
```

Keep production values in your host’s secret manager. `JWT_SECRET`, database credentials, OAuth secrets, storage secrets, and notification tokens must never appear in GitHub. Generate a new `JWT_SECRET` for the new host; changing it intentionally invalidates old sessions.

## 7. Configure private file storage

Create a private bucket called something like `rideflow-private`. Configure a service account with access only to that bucket. The portable `server/storage.ts` uses the AWS SDK and works with AWS S3 and compatible services.

RideFlow stores file bytes in object storage and file metadata in the database. The metadata identifies the owner, purpose, ride or driver, MIME type, size, storage key, and review state. The app returns signed URLs rather than exposing private documents publicly.

Test profile-photo upload, driver-license upload, insurance upload, invalid MIME type, oversized file, unauthorized retrieval, expired signed URL, and storage outage. Do not store identity documents in `client/public` or commit them to GitHub.

## 8. Configure your identity provider

Register a web application with your OIDC provider. Set the callback URL to:

```text
https://your-domain.example.com/api/oauth/callback
```

Set the allowed web origin to:

```text
https://your-domain.example.com
```

The provider must support an authorization-code flow and return an access token that can call a userinfo endpoint. The userinfo response must contain a stable `sub` or `id`, plus name and email where available.

Test sign-in, callback state validation, logout, expired session, unknown user, duplicate login, admin bootstrap, admin transfer, and unauthorized admin action. Do not rely on a frontend role button; the server checks every protected procedure.

## 9. Configure signup notifications

RideFlow sends a JSON notification to `NOTIFICATION_PROVIDER_URL`. Build a small adapter on your server or connect an approved email provider. The payload contains a title, content, and configured recipient. The notification should include signup name, email, role, and creation time, but never passwords, access tokens, full payment data, or identity-document bytes.

Test a successful notification, provider outage, retry behavior, duplicate-login suppression, and a notification address change from the Admin Control Room. Confirm whether your provider delivers email or only accepts a webhook; the application cannot assume that a webhook automatically means email delivery.

## 10. Start and test the self-hosted app

Run:

```bash
pnpm check
pnpm test
pnpm build
NODE_ENV=production pnpm start
```

Open the HTTPS domain and test the public overview. Then sign in and test a profile read, profile photo upload, driver-document upload, fare quote, admin settings read, and signup notification. Inspect server logs for failed database, storage, OAuth, and notification calls.

For production, put the Node process behind a reverse proxy or managed HTTPS service. Set the proxy to forward WebSocket traffic if you later add realtime chat and live location. Configure a health endpoint and restart policy.

## 11. Moving existing data safely

The new code does not copy existing data automatically. A safe migration has five stages: inventory the old tables and files; create encrypted backups; restore into a temporary new database and bucket; run row-count, relationship, and file-reference checks; then schedule a controlled cutover.

Users may need to sign in again if the identity provider changes. Password hashes, OAuth subject IDs, session secrets, and payment-provider customer IDs must not be copied casually. Driver documents require special handling, access review, and retention rules.

Do not delete the old database until the new environment has passed a recovery test and the business owner approves the final cutover.

## 12. What the code does not provide automatically

Self-hosting the code does not automatically create a production ride marketplace. You still need maps and routing, driver availability, dispatch, realtime location, chat, scheduled jobs, payment authorization, refunds, disputes, driver payouts, fraud controls, legal agreements, driver verification operations, customer support, monitoring, backups, and incident response.

The 5% commission is a server-side application rule and ledger entry. It is not a payment-provider payout configuration. Before processing money, configure the chosen marketplace payment provider, verify business onboarding, reconcile provider webhooks, and obtain legal and tax advice for your launch country.

## 13. Backup and recovery checklist

Back up the database and object storage separately. Test restoring both into a clean environment. Keep at least one backup outside the primary server. Record when backups ran, how long they are retained, and who can restore them.

A recovery test should restore the schema, import representative data, restore private files, recreate secrets, start the server, sign in, open a profile, read a fare rule, and retrieve an authorized file through a signed URL. If any step fails, the backup plan is incomplete.

## 14. GitHub workflow

After changing portable configuration, run the checks and commit the source:

```bash
git status
git diff
pnpm check
pnpm test
pnpm build
git add .
git commit -m "Prepare RideFlow for self-hosting"
git push origin main
```

Keep the repository private. Review `.gitignore` before committing. Never commit `.env`, database dumps, private keys, storage credentials, payment secrets, identity documents, or production logs.

## 15. Practical first week on your own server

On day one, provision the server, database, storage bucket, domain, HTTPS, and backup destination. On day two, configure OIDC and verify login. On day three, run migrations and test uploads. On day four, connect notifications and the Admin Control Room. On day five, run the full test suite and a controlled staging pilot. Do not accept real fares until payments, payouts, support, and incident procedures are ready.

The successful end state is not simply “the page opens.” It is a system where a user can sign in, a driver can be verified, a quote can be calculated, a ride can be tracked, money can be reconciled, a private document can be protected, an incident can be handled, and the entire service can be restored from backups.

## References

[1]: https://orm.drizzle.team/docs/overview Drizzle ORM documentation
[2]: https://dev.mysql.com/doc/ MySQL documentation
[3]: https://www.rfc-editor.org/rfc/rfc6749 OAuth 2.0 authorization framework
[4]: https://openid.net/specs/openid-connect-core-1_0.html OpenID Connect Core
[5]: https://docs.aws.amazon.com/AmazonS3/latest/userguide/ Welcome to Amazon S3 documentation
[6]: https://owasp.org/www-project-top-ten/ OWASP Top 10
[7]: https://git-scm.com/book/en/v2 Pro Git
