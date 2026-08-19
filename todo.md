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
- [ ] Protect ledger entries with a database trigger that rejects UPDATE and DELETE operations (not supported by the project’s TiDB database engine).
- [x] Add authenticated-procedure authorization tests using controlled test contexts.
- [ ] Verify successful authenticated quote and onboarding uploads end to end with a real signed-in browser session.
- [x] Add authenticated success-path tests for fare quote creation and file upload using mocked storage/database boundaries.
