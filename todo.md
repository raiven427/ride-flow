# RideFlow upgrade checklist

- [x] Confirm the published RideFlow domain and current visibility state.
- [x] User changed deployment visibility to private in the Management UI; the preview confirms it cannot be shared publicly.
- [x] Upgrade the static project to the full-stack template.
- [x] Verify that the existing frontend remains available after the upgrade.
- [x] Document database, authentication, and file-storage next steps.
- [x] Add RideFlow profile and uploaded-file database tables.
- [x] Add protected profile and file-upload procedures.
- [x] Connect the profile photo upload UI and upload validation tests.

- [x] Add driver onboarding uploads for license, insurance, and vehicle documents.
- [x] Add configurable Nairobi fare rules with server-side distance/time calculation.
- [x] Add fare quotes, 5% commission calculations, and append-only ledger entries.
- [x] Connect the transparent fare breakdown UI to server-calculated values.
- [x] Add pricing calculation tests using the documented Kenya demo assumptions.
- [x] Add application-level append-only ledger helpers with no update/delete procedures.

- [x] Make driver onboarding uploads require an authenticated account before upload and surface the login action clearly.
- [x] Move fare rules into a database-backed configuration table with owner/admin update procedure.
- [x] Documented TiDB trigger limitation and retained application-level append-only ledger protection with no update/delete procedures.
- [x] Add authenticated-procedure authorization tests using controlled test contexts.
- [x] Documented real signed-in browser verification as a required owner follow-up; the private preview correctly redirects protected actions to Manus OAuth.
- [x] Add authenticated success-path tests for fare quote creation and file upload using mocked storage/database boundaries.

- [x] Confirm the initial admin email (`njengastephen112@gmail.com`) and owner-transfer policy.
- [x] Add database-backed admin roles and transferable admin ownership.
- [x] Build an admin settings view for fare rules and critical RideFlow configuration.
- [x] Send an owner notification when a new user signup is persisted.
- [x] Add tests for admin authorization, admin transfer, and signup notification dispatch.
- [x] Write the GitHub/PC operations handoff guide.
- [x] Export the operations guide as a downloadable PDF.
- [x] Load current fare/admin settings into the Admin Control Room and add editable notification email configuration.
- [x] Add successful and failure-path tests for admin ownership transfer.

- [x] Diagnose the unresponsive GitHub Connect action; the initial connector/token lacked repository write access.
- [x] Export RideFlow to the private GitHub repository `raiven427/ride-flow` using the authenticated GitHub CLI after merging its initial README.
- [x] Verify that secrets and private documents are excluded from the GitHub handoff.

- [x] Verify the new private GitHub repository target and source cleanliness.
- [x] Push the current RideFlow source to the private Rideflow repository.
- [x] Verify the pushed branch and repository privacy state.
- [x] Use the corrected GitHub target `raiven427/ride-flow` for the source handoff.
- [x] Prepare the latest source ZIP as a fallback phone-transfer archive.
- [x] Documented the phone upload path; direct full-tree GitHub push was completed instead.
- [x] Verify the repository contains the expected source directories and no tracked environment/credential files or obvious secret assignments.
- [x] Verify GitHub repository access for the account associated with `njengastephen112@gmail.com` (authenticated GitHub login is `raiven427`).
- [x] Transfer the complete readable source tree into `raiven427/ride-flow`.
- [x] Verify all source directories are present and secrets are excluded.

- [x] Write the RideFlow engineering and self-study handbook covering code, database, servers, APIs, payments, security, and operations.
- [x] Compile and verify the handbook as a PDF.
- [x] Deliver the PDF with a practical learning and launch roadmap.

- [x] Audit Manus/project-hosted dependencies and define what must be replaced for self-hosting.
- [x] Add a self-hosting configuration and remove hardcoded project-hosting assumptions.
- [x] Preserve portable database, storage, authentication, and server contracts.
- [x] Validate the portable build and update the private GitHub repository.
- [x] Document removed dependencies and required services on the new host.

- [x] Preserve existing database schema/data while separating the codebase from Manus-hosted services.
- [x] Add portable self-hosting configuration and provider adapters.
- [x] Write the new-database connection and migration PDF.
- [x] Validate the portable build and update the private GitHub repository.
- [x] Push the self-hosting conversion commit to `raiven427/ride-flow`.
- [x] Verify GitHub contains the portable README, S3 storage adapter, OIDC auth adapter, and new database guide.
- [x] Verify GitHub no longer contains Manus-only runtime, debug, storage-proxy, or hosted-integration artifacts.

- [x] Audit current Stripe, M-Pesa Daraja, deployment, and production environment boundaries.
- [x] Add environment-driven Stripe and Daraja configuration scaffolding without real credentials.
- [x] Add production validation and provider webhook contracts.
- [x] Write and compile the deployment and payments setup PDF.
- [x] Validate the handoff and push the deployment-ready code to private GitHub.
- [x] Push the latest Stripe/Daraja deployment scaffolding to `raiven427/ride-flow`.
- [x] Verify the private GitHub remote contains the latest payment, webhook, environment-template, and deployment-guide files.

- [x] Audit the latest local deployment/payment code against private GitHub.
- [x] Write a complete codebase map and maintenance/update handbook.
- [x] Compile and verify the comprehensive code guide PDF.
- [x] Push the latest source and guide to private GitHub.

- [x] Reset demo earnings, savings, trips, and activity metrics to zero/new-installation values without removing admin settings.
- [x] Add authenticated presence and activity data for admin operations monitoring.
- [x] Build an admin-only operations dashboard for online users and app activity.
- [x] Write and compile an Ubuntu/developer operations PDF for the new dashboard and maintenance workflow.
- [x] Validate and push the refreshed app and documentation to private GitHub.
- [x] Reset remaining hardcoded driver earnings/acceptance metrics and trip history to true new-installation empty states.
- [x] Wire meaningful activity logging into sign-in, fare quote, upload, and admin settings actions.
- [x] Add explicit loading, refresh, and error states to the admin operations dashboard.
- [x] Record authenticated sign-in activity from `upsertUser` and add regression coverage.
- [x] Commit and push the final refreshed source and Ubuntu guide to private GitHub; verify the remote.
- [x] Add a Vitest regression test for `upsertUser` proving it records a `sign_in` activity event on signup and returning login.
- [x] Prepare the existing Ubuntu developer PDF for direct download attachment.
- [x] Attempt browser verification of customer, driver, and profile flows; document the remaining signed-in OAuth takeover blocker for customer/driver/admin protected-flow testing.
- [x] Add practical GPS/dispatch architecture and activity-retention policy guidance for pre-launch readiness.
- [x] Write and compile a second PDF covering browser verification, GPS/dispatch, retention, and launch steps.
- [x] Add a payment-method selector above Profile photo with Cash, M-Pesa, PayPal, and Cards options.
- [x] Document how to change the admin email and rotate the authentication credential without exposing passwords.
- [x] Write and compile a detailed PDF for authenticated browser verification, Stripe/M-Pesa sandbox testing, realtime GPS/dispatch hosting, and activity retention.
- [x] Write and compile a detailed free-hosting deployment PDF covering server, database, authentication, storage, Stripe, M-Pesa, DNS, secrets, backups, and free-tier limitations.
- [x] Correct the free-hosting PDF’s MySQL connection-string example and re-review deployment-critical commands before the final checkpoint.
- [x] Write and compile a complete infrastructure and file-inventory PDF covering the application files, database, server, storage, authentication, payments, operations, backups, and deployment requirements.
- [x] Write and compile a professional developer onboarding and handoff PDF explaining RideFlow’s code, architecture, infrastructure, deployment, testing, unfinished work, and maintenance workflow.
- [x] Write and compile detailed beginner developer notes for all ten RideFlow learning areas, including explanations, examples, exercises, commands, mistakes, and a study path.
- [ ] Write and compile a comprehensive PDF documenting every development style and engineering pattern used in RideFlow, with examples and guidance on when to use each one.
