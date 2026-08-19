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
