# Security review: team administration and OTP login

## Scope

The endpoint scanner inventoried 17 route files. Detailed implementation and tests cover `/api/admin/members` (GET/POST/PATCH/DELETE), OTP start/verification, the shared session/membership check, and the audit viewer. The scanner's authentication warnings are heuristic false positives for handlers using the shared `getAdmin()` guard. Existing unrelated CMS endpoint rate limits are outside this feature's implementation scope.

The existing Supabase Auth, HttpOnly rotating SSR cookies and database roles are retained. This is one website, with administrator, publisher and editor roles; it has no tenant/property hierarchy or inventory/payment workflows. Only active administrators may manage team access. Staff roles never come from browser metadata.

The server-only service client creates Auth identities, generates one-time codes and uses the shared PostgreSQL rate limiter. Membership mutations run through the caller's authenticated RPC context. Auth identities and audit records are retained when a CMS membership is removed. No localStorage user directory, passwords or browser-side role grants are introduced.

## Findings and applied fixes

### High: prevent old sessions regaining restored access

Deactivation/reactivation without a session cutoff would allow a previously issued session to regain CMS privileges after reactivation. The migration adds `access_after`, checks the actual Auth session creation time in `cms_staff_role()`, and updates the cutoff whenever access changes. Re-added and reactivated users must complete a new OTP login. The shared API/page guard and database RLS use this role check. Removed or deactivated memberships have no CMS role even if their JWT has not expired.

Verification: PostgreSQL tests reject old sessions after deactivate/reactivate and delete/re-add; a new session receives the correct role.

### High: authorization, concurrent updates and audit integrity

The route verifies the user and administrator role; the database repeats authorization under a transaction-level advisory lock. Self-removal/deactivation and removal of the last active administrator are blocked. Membership writes and audit events commit together. Direct authenticated INSERT/UPDATE/DELETE grants on the membership table are revoked.

Verification: anonymous, editor and non-member RPC calls fail; direct writes fail; self-removal fails; an intentionally failed audit insert rolls the membership change back. A live concurrent multi-connection test against the hosted project was unavailable. The lock and role recheck are implemented in SQL and exercised through the local PostgreSQL engine.

### Medium: team directory only returned the caller's own RLS row

The original GET queried the own-membership table directly, so it could not show a useful team directory with emails. The new bounded, administrator-only RPC joins Auth identities and returns only email, role, active status, creation date and last sign-in date. It grants no browser access to Auth tables.

### Medium: validation and rate limits for new mutations

Team mutations use same-origin protection, strict email/UUID/action schemas, a 2 KB actual streamed body limit, shared database rate limits and private/no-store responses. Unexpected privilege fields are rejected. Mutation limits are keyed to the verified administrator rather than a changeable IP. OTP email limits are also identity-scoped across IPs.

Verification: API tests cover unauthenticated requests, non-admins, wrong origin, throttling, malformed/oversized bodies, unexpected privilege fields and accepted mutations.

### Medium: OTP templates and response privacy

After migration, active staff OTP requests use Supabase-generated codes delivered through the existing Resend sender. The email contains the code in HTML and plain text. Unknown/inactive accounts receive the same public response; generation/delivery runs after that response to avoid provider timing exposing membership. No code, link or provider token is returned or logged. Verification remains with Supabase and rechecks the live staff role. Only a missing new RPC temporarily retains the pre-existing hosted-Auth login path during rollout; other database errors fail closed.

Verification: real Supabase account creation, six-digit OTP verification, replay rejection and CMS denial passed for a unique temporary identity. That test identity was removed. No email was sent by the live check. Resend formatting/dispatch and public-response privacy are tested with mocked transports; actual inbox delivery was not tested.

## Database changes and rollout

Apply `supabase/migrations/20261017025958_secure_team_management.sql` to the website's existing project after the existing CMS/audit migrations. It adds `access_after` and the protected `cms_list_team_members`, `cms_manage_team_member` and server-only `cms_can_request_admin_otp` functions. Functions have fixed search paths and explicit execution grants. Existing active memberships retain their current sessions. Removal keeps content, Auth identities and historical audit events.

The website project is `gseepotcyjvpfjwxdfkw`. The connected Supabase account returned a permission error for this project; the local CLI has no management login. The migration has NOT been applied remotely. Apply it in that project's SQL Editor before deploying this code. No new environment secret is required. Existing admin login remains available until the migration is installed.

## Verification and remaining limits

Local SQL/API/security tests, TypeScript and a complete production build were run. Chrome fixture previews checked widths 320, 390, 500, 650, 768, 900, 980, 1024, 1280 and 1536 pixels without horizontal overflow. These previews use sample addresses. A complete live administrator add/deactivate/reactivate/remove journey requires the migration and access to the correct project. No unrelated public enquiry/email code was changed.

The package audit reports seven inherited advisories (six high, one moderate) in Next.js/PostCSS and lint/glob dependencies. The added pinned PGlite test dependency has no reported advisory. A framework dependency update is separate work; no forced or breaking upgrades were applied here. Existing image/font and unrelated hook lint warnings remain. This report does not certify the entire application as production-ready.
