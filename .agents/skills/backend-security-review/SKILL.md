---
name: backend-security-review
description: Reviews and hardens Next.js API route handlers (app/api/**/route.ts and pages/api/**/*.ts), Supabase integrations, PostgreSQL functions, Row Level Security policies, Storage access, authentication flows, and critical business workflows against real-world attacks — missing auth/authorization, IDOR, tenant or property data leakage, privilege escalation, broken RLS, unsafe service-role usage, SQL/NoSQL injection, XSS, CSRF, mass assignment, insecure CORS, missing security headers, secret exposure, insecure file uploads, race conditions, duplicate submissions, inventory corruption, unsafe approvals, weak audit logs, and endpoints with no rate limiting. Produces a severity-ranked findings report AND applies fixes directly — per-endpoint rate limiting, strict input validation/sanitization, secure authorization, property isolation, transaction-safe workflow protection, and injection/XSS-safe patterns. Use this whenever the user asks to secure, harden, audit, or pen-test a backend, API, or Supabase project, wants their endpoints or workflows "production-ready," or mentions rate limiting, sanitizing input, preventing XSS/injection, protecting roles, securing RLS, preventing cross-property access, or making a project secure — even if they don't use the words "security review."
---

# Backend Security Review (Next.js API Routes)

## Why this matters

Most API vulnerabilities aren't exotic — they're an endpoint that forgot to check who's asking, a database query built by gluing strings together, a role or property ID trusted from the browser, a Supabase table exposed without correct Row Level Security, a service-role key accidentally bundled into the frontend, or a form field that gets stored and later rendered as raw HTML.

Business systems also fail when technical security exists but workflow security does not. A user may be authenticated but still be able to approve their own request, receive the same Purchase Order twice, issue stock that is no longer available, modify another property's data, overwrite a newer record, or edit audit history.

This skill exists to catch that whole category systematically, endpoint by endpoint and workflow by workflow, rather than fixing whichever bug happens to be visible. Treat every route handler, Server Action, RPC input, database function parameter, Storage path, request body, query parameter, header, cookie, JWT claim, role, property ID, user ID, record ID, and localStorage value as attacker-controlled until proven otherwise.

## Process

Work through these phases in order. Don't skip the inventory step even if the user only mentions "the login endpoint" — a review that's scoped too narrowly misses the sibling endpoint, database function, RLS policy, Storage rule, or workflow nobody thought to check.

### 1. Inventory every endpoint

Run the scanner to enumerate route handlers and get a first pass of heuristic findings:

```bash
python3 scripts/scan_endpoints.py <project-root>
```

This finds every `app/api/**/route.{ts,tsx,js,jsx}` and `pages/api/**/*.{ts,tsx,js,jsx}` file, lists the exported HTTP methods in each, and flags textual patterns worth a closer look (no visible auth check, string-built SQL, `req.body` spread into a DB write, `dangerouslySetInnerHTML`, permissive CORS, no rate-limit call, etc.).

Also inventory:

- Server Actions
- Middleware
- Authentication callbacks
- Webhooks
- File upload routes
- Export and report routes
- Supabase browser clients
- Supabase server clients
- Service-role clients
- SQL migrations
- PostgreSQL functions and RPCs
- Row Level Security policies
- Storage buckets and Storage policies
- Realtime subscriptions and channels
- Edge Functions
- Scheduled functions
- Direct database writes
- JSON file writers
- localStorage-backed adapters
- Import and migration scripts
- Approval, receiving, inventory, payment, and other sensitive workflow services

For Supabase projects, verify where each client is created and where the service-role key is available. The service-role key must never be imported into client components, browser bundles, or `NEXT_PUBLIC_*` variables.

**Treat the scanner's output as a lead list, not a verdict.** It's regex-based — it will miss things wrapped in helper functions and will occasionally flag safe code. Every flagged line still needs your own reading of the surrounding logic, and every *unflagged* endpoint, RPC, RLS policy, Storage policy, and sensitive workflow still needs a pass against the checklist below, since the scanner only catches the patterns it knows to look for.

Before applying fixes, document:

- The authentication provider
- Session and cookie strategy
- Roles and permissions
- Property, tenant, company, organization, department, outlet, and store boundaries
- Which records are financially sensitive
- Which workflows change inventory or approval state
- Which tables are exposed through Supabase
- Which operations use service-role privileges
- Which data still exists in JSON or localStorage
- Whether the app is deployed to serverless, edge, or a long-running server

### 2. Review each endpoint against the checklist

Read `references/vulnerability-checklist.md` and walk every endpoint through it. The checklist covers auth/authorization (including IDOR), injection (SQL/NoSQL/command), XSS, mass assignment, CSRF, CORS, security headers, secrets exposure, error handling, file uploads, SSRF, session/JWT handling, HTTP method enforcement, prototype pollution, and sensitive-data logging — with Next.js-specific before/after examples for each.

For Supabase projects, also review:

- Whether RLS is enabled on every exposed application table
- Whether `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies are correctly scoped
- Whether users can access another property by changing an ID
- Whether property membership is verified in the database
- Whether inactive users or suspended properties are blocked
- Whether a browser-provided role, permission, sender ID, user ID, or property ID is trusted
- Whether service-role credentials are exposed or overused
- Whether `SECURITY DEFINER` functions use a safe fixed `search_path`
- Whether function execution grants are restricted
- Whether database functions verify authentication, membership, permission, property consistency, expected status, and approval limits
- Whether Storage buckets are private
- Whether Storage policies match database permissions
- Whether signed URLs expire
- Whether Realtime subscriptions are property-scoped and authorized
- Whether audit and inventory-ledger tables are append-only
- Whether direct client updates to inventory balances or protected totals are blocked
- Whether views expose sensitive columns that the user should not receive

For each endpoint, reason concretely about:

- **Who can call this, and what do they need to prove?** (authentication) Then: **can they only affect their own data, their assigned property, department, outlet, or store, or can they affect anyone's?** (authorization/IDOR) — these are separate checks; an endpoint can require login and still let any logged-in user edit another user's or another property's record.
- **Where does user input end up?** Trace every field from `req`, a Server Action, RPC call, query string, route parameter, upload, Storage path, or migration file into a query, database function, shell command, file path, HTML sink, log, external URL, or response — that's where injection, XSS, path traversal, SSRF, mass assignment, and data leakage live.
- **What happens if this is called 1,000 times in a second?** — that's the rate-limiting and resource-exhaustion question.
- **What happens if two users perform this action at the same time?** — that's the race-condition and concurrency question.
- **What happens if the same request is retried?** — that's the duplicate-submission and idempotency question.
- **What status transitions are allowed?** — verify that invalid approval, PO, GRN, transfer, issuance, inventory, or payment transitions are rejected server-side.
- **What records must change together?** — multi-table workflows must be protected by a database transaction so they succeed or fail as one operation.

Review sensitive business workflows separately:

#### Authentication and user administration

- Prevent account enumeration.
- Rate-limit login, OTP, recovery, and invitation attempts.
- Prevent users from assigning themselves a higher role.
- Prevent Property Admins from becoming platform Super Admins.
- Derive identity from the verified session.
- Keep role and membership data server-authoritative.
- Use MFA for privileged users when required.

#### Requisitions and approvals

- Prevent unauthorized self-approval.
- Enforce approval limits server-side.
- Prevent the same approval step from being decided twice.
- Prevent rejected records from being approved without an authorized reset.
- Preserve append-only approval history.
- Reject direct client-supplied status changes.

#### Purchase Orders and overwrite workflows

- Validate suppliers, prices, discounts, VAT, and totals server-side.
- Create Master PO and child POs atomically.
- Prevent cross-property Requisition and PO links.
- Require approval for overwrites.
- Preserve version history.
- Prevent stale updates from overwriting newer versions.

#### GRN and receiving

- Allow GRNs only for eligible Purchase Orders.
- Prevent receiving beyond the remaining ordered quantity unless explicitly permitted.
- Prevent duplicate GRN posting.
- Prevent posted GRNs from being silently edited.
- Update PO receiving state, inventory, supplier price history, and audit logs atomically.

#### Inventory, transfer, issuance, and Month-End

- Block direct client updates to inventory balances.
- Record every inventory change in an append-only ledger.
- Deduct source stock and add destination stock in one transaction.
- Prevent negative inventory unless explicitly allowed.
- Verify store access.
- Prevent duplicate transfer, issuance, or count posting.
- Preserve wastage, returns, reversals, and corrections as history rather than destructive edits.

#### Reports, exports, and financial data

- Do not rely on hiding amounts in the frontend.
- Restrict financial fields at the query, view, RPC, or response level.
- Property-scope every report.
- Rate-limit expensive reports and exports.
- Audit exports of sensitive data.

#### Files and documents

- Use private Storage buckets unless intentionally public.
- Validate file type, actual signature, size, count, entity ownership, and property ownership.
- Generate storage paths and file names server-side.
- Prevent executable or dangerous uploads.
- Use short-lived signed URLs.
- Audit file upload, replacement, and deletion.

#### Audit logs

- Record actor, property, action, entity type, entity ID, before values, after values, timestamp, and request ID.
- Prevent ordinary clients from updating or deleting audit events.
- Do not trust audit events generated only in localStorage or browser code.

#### Migration and legacy data

- Do not delete JSON or localStorage data immediately.
- Export browser-local data before cutover.
- Use migration batches, legacy IDs, checksums, and idempotent imports.
- Reject cross-property relationships.
- Reconcile financial totals and inventory balances.
- Do not allow two writable sources for the same module.
- Keep a tested rollback path.

### 3. Write the findings report

Use this structure for the report — always lead with severity, since that's what determines what gets fixed first:

```markdown
# Security Review: <project/area name>

## Summary
<1-3 sentences: how many endpoints, database functions, RLS policies, Storage policies, and workflows were reviewed, and how many findings exist by severity>

## Scope
- API routes reviewed:
- Server Actions reviewed:
- Supabase tables reviewed:
- RLS policies reviewed:
- Database functions/RPCs reviewed:
- Storage buckets and policies reviewed:
- Realtime channels reviewed:
- Sensitive workflows reviewed:
- Tests executed:
- Areas not verifiable:

## Findings

### 🔴 Critical
**[Category] <short title>** — `path/to/route.ts:<line>`
<What's wrong, and the concrete way it's exploitable — not just "missing validation" but "an authenticated user can change `propertyId` and read another hotel's Purchase Orders because the query does not verify property membership.">

Impact: <What user data, property data, financial records, inventory, approval state, files, or system integrity can be affected>

Fix: <what you changed, or what needs a human decision>

Verification: <how the fix was tested or should be tested>

### 🟠 High
...
### 🟡 Medium
...
### 🟢 Low
...

## Applied fixes
<List of files changed and what was added — authentication checks, authorization checks, RLS policies, Storage policies, rate limiting, validation schemas, sanitization, transactions, row locks, idempotency, audit events, and query fixes>

## Database and RLS changes
<List migrations, policies, functions, grants, views, triggers, and Storage rules changed>

## Workflow integrity changes
<List approval, Purchase Order, GRN, inventory, transfer, issuance, record-versioning, and duplicate-submission protections added>

## Verification results
- Syntax:
- Type checking:
- Linting:
- Unit tests:
- Integration tests:
- Authentication tests:
- Authorization tests:
- RLS tests:
- Cross-property tests:
- Concurrency tests:
- Migration tests:
- Build:

## Needs your decision
<Anything that requires business-logic knowledge you don't have: who should be able to access or approve a resource, whether self-approval is allowed, approval limits, financial visibility, whether negative inventory is permitted, file limits, retention rules, whether an endpoint is public, or what rate limit is appropriate. Don't guess at business rules — flag them instead.>
```

Severity guide:

- **Critical** = unauthenticated data breach, authentication bypass, exposed service-role key, cross-property data leakage, full SQL injection, unrestricted administrative function, role escalation, RLS disabled or bypassed on sensitive exposed data, or direct unauthorized financial/inventory manipulation.
- **High** = authenticated IDOR, stored XSS, broken approval authorization, unauthorized self-approval, direct client inventory updates, duplicate GRN/payment posting, editable audit logs, insecure file access, missing transaction protection on critical workflows, or missing rate limits on authentication/expensive endpoints.
- **Medium** = missing security headers, permissive CORS, verbose error disclosure, broad Realtime subscriptions, incomplete upload validation, missing record versioning, weak logging hygiene, or missing rate limits on ordinary mutations.
- **Low** = defense-in-depth improvements, additional monitoring, tighter constraints, or documentation gaps.

Assign severity based on actual exploitability and business impact, not only the category name.

### 4. Apply fixes

#### Authentication and authorization

- Derive identity from the verified session.
- Query trusted membership and permissions.
- Enforce ownership and property scope in the query or database function.
- Reject client-controlled role, user, sender, property, approval-limit, status, price, and ownership fields.

#### Supabase Row Level Security

- Enable RLS on every exposed application table.
- Apply least-privilege policies separately for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
- Enforce property membership.
- Block inactive users and suspended properties.
- Verify that views, functions, Storage policies, and Realtime access do not bypass the intended rules.

#### Service-role security

- Keep service-role credentials only in trusted server code or Edge Functions.
- Never expose them in browser code or `NEXT_PUBLIC_*`.
- Avoid service-role access when the authenticated user's RLS context should be used.

#### Database functions and RPCs

- Verify authentication, permission, property consistency, status, approval limit, ownership, and input.
- Use row locks and transactions for sensitive workflows.
- Restrict execution grants.
- Configure safe `SECURITY DEFINER` functions with a fixed `search_path`.

```sql
create or replace function public.example_secure_function(...)
returns ...
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Verify auth.uid(), membership, permission, property, and status.
  -- Lock affected rows before applying sensitive changes.
end;
$$;
```

#### Rate limiting

Read:

```text
references/rate-limiting.md
```

Add per-endpoint limits sized to what each endpoint does:

- Authentication endpoints: strict
- Public reads: lenient
- Mutations: controlled
- Reports, exports, uploads, and expensive operations: strict

Do not apply one blanket limit to every route. On serverless or edge deployments, use a shared external or database-backed limiter instead of an in-memory production limiter.

#### Validation and sanitization

Read:

```text
references/sanitization-validation.md
```

Add a strict schema such as Zod to every endpoint, Server Action, RPC wrapper, import, and upload.

```ts
import { z } from "zod";

const schema = z.object({
  propertyId: z.string().uuid(),
  quantity: z.number().positive().max(100000),
  remarks: z.string().trim().max(1000).optional(),
}).strict();
```

Requirements:

- Enforce UUIDs.
- Enforce string lengths.
- Enforce numeric ranges.
- Enforce enums.
- Limit pagination and array sizes.
- Reject unexpected fields.
- Explicitly map allowed fields instead of spreading the request body.

#### Injection prevention

- Use parameterized PostgreSQL queries and safe query-builder methods.
- Validate RPC inputs.
- Allowlist dynamic sort fields.
- Apply NoSQL filter protection only when a NoSQL database is present.
- Prevent command injection.
- Block path traversal.
- Restrict user-supplied outbound URLs to prevent SSRF.

```ts
// Unsafe
await db.query(`SELECT * FROM users WHERE email = '${email}'`);

// Safe
await db.query("SELECT * FROM users WHERE email = $1", [email]);
```

#### XSS protection

- Sanitize genuine rich text on write.
- Treat ordinary fields as plain text.
- Use safe output encoding.
- Prefer removing `dangerouslySetInnerHTML`.

```tsx
// Preferred: React escapes plain text.
<div>{remarks}</div>
```

#### CSRF, CORS, cookies, and headers

- Protect cookie-authenticated mutations.
- Use suitable SameSite settings.
- Validate trusted origins.
- Configure an explicit CORS allowlist.
- Enforce HTTPS in production.
- Add Content Security Policy.
- Add `X-Content-Type-Options`.
- Add frame protection.
- Add Strict Transport Security.
- Add Referrer Policy.
- Add Permissions Policy where appropriate.

#### Storage security

- Use private buckets.
- Use property-scoped paths.
- Add Storage RLS.
- Use signed URLs.
- Generate file names server-side.
- Validate file type, signature, and size.
- Reject executable files.
- Verify entity and property ownership.
- Audit uploads and deletions.

```text
{property_id}/{entity_type}/{entity_id}/{generated_uuid}.{extension}
```

#### Workflow integrity

- Move sensitive status changes into trusted database functions or server transactions.
- Verify expected status.
- Enforce approval limits.
- Prevent prohibited self-approval.
- Lock relevant rows.
- Add idempotency keys.
- Add record versions.
- Prevent duplicate posting.
- Preserve append-only audit and transaction history.

#### Inventory integrity

- Prohibit direct browser updates to inventory balances.
- Use an append-only inventory transaction ledger.
- Update source and destination atomically.
- Prevent unauthorized negative stock.
- Audit every receipt, issue, transfer, adjustment, wastage, count variance, return, and reversal.

#### Error handling and logging

Return safe and consistent errors:

```json
{
  "error": "You do not have permission to approve this purchase order.",
  "code": "PO_APPROVAL_FORBIDDEN",
  "requestId": "req_12345"
}
```

Never expose:

- Stack traces
- SQL errors
- Table names
- RLS policy names
- Internal paths
- Secret values

Never log:

- Passwords
- OTP codes
- Access tokens
- Refresh tokens
- Session cookies
- Service-role keys
- Full sensitive request bodies

#### Migration security

- Preserve backups.
- Export localStorage.
- Use migration batches and checksums.
- Make imports idempotent.
- Reconcile totals and inventory.
- Prevent cross-property imports.
- Keep legacy data read-only during verification.
- Do not permit two writable data sources for the same module.

#### Apply fixes without breaking behavior

Fix issues in place rather than adding a wrapper that changes the endpoint's behavior or response shape. The goal is a secure version of the same API and workflow, not a different one.

#### Required verification after fixes

Test at least:

```text
Unauthenticated access
Expired or invalid sessions
Inactive users
Suspended properties
Super Admin access
Property Admin access
Director access
Manager access
Supervisor access
Staff access
User from another property
User without membership
User without store assignment
Allowed and forbidden reads
Allowed and forbidden inserts
Allowed and forbidden updates
Protected-column updates
Forbidden deletes
Cross-property record IDs
Self-approval attempts
Approval-limit violations
Duplicate approval
Duplicate GRN posting
Over-receiving
Negative inventory
Duplicate transfer or issuance
Stale record updates
Unauthorized file downloads
Invalid uploads
Duplicate migration imports
Existing UI and API response regression
```

Run all available syntax, type, lint, test, build, migration, SQL, secret-scan, and dependency-scan checks. Be explicit about anything that could not be executed.

### 5. Summarize

Tell the user what changed in the `Applied fixes` section of the report.

#### Required summary categories

- Authentication and authorization changes
- RLS and property-isolation changes
- Database function and transaction changes
- Validation and sanitization changes
- Rate-limit changes
- Storage changes
- Approval and inventory workflow protections
- Audit and logging changes
- Migration safety changes
- Tests completed
- Tests not completed

#### Needs your decision

Be explicit about anything in `Needs your decision`. Do not silently guess:

- Who counts as an administrator
- Who may approve each record
- Whether self-approval is allowed
- Approval limits
- Financial visibility
- Whether negative stock is permitted
- Which documents are public
- Retention periods
- Endpoint visibility
- Appropriate rate-limit values

Getting those rules wrong either breaks legitimate access or creates a false sense of security.

#### Production-readiness rule

Do not call the system production-ready unless the available build, type checking, tests, RLS tests, cross-property tests, role tests, workflow tests, concurrency tests, Storage tests, and migration checks pass.

#### Security implementation checklist

```text
SECURITY IMPLEMENTATIONS

Authentication and Session Security
Supabase Authentication or Existing Verified Authentication
Email OTP, Password, Magic Link, or SSO Security
Secure Session Management
Session Expiration and Token Refresh
Secure Logout and Session Revocation
Multi-Factor Authentication for Privileged Accounts
Login, OTP, Recovery, and Invitation Rate Limiting
Account Enumeration Protection
Brute-Force and Bot Protection

Authorization and Access Control
Role-Based Access Control
Permission-Based Access Control
Server-Side Authentication Checks
Server-Side Authorization Checks
Supabase Row Level Security
Property or Tenant Data Isolation
Department, Outlet, and Store Access Control
Ownership Enforcement
Approval Limit Enforcement
Self-Approval Prevention
Privilege Escalation Prevention
IDOR Prevention
Restricted Financial Data Access
Restricted Administrative Operations

Input and Application Security
Strict Input Validation
Zod or Equivalent Schema Validation
Reject Unexpected Request Fields
Maximum Length and Range Validation
Data Sanitization
Anti-XSS Protection
Stored XSS Prevention
Reflected XSS Prevention
DOM-Based XSS Prevention
Safe Output Encoding
Unsafe HTML Sink Removal
SQL Injection Prevention
Parameterized Database Queries
Secure RPC Parameter Validation
NoSQL Injection Prevention When Applicable
Mass Assignment Prevention
Prototype Pollution Prevention
Command Injection Prevention
SSRF Prevention
Path Traversal Prevention

API and Request Security
Endpoint-Specific Rate Limiting
Mutation Rate Limiting
Search and Export Rate Limiting
File Upload Rate Limiting
Request Body Size Limits
Array and Pagination Limits
Allowed HTTP Method Enforcement
CSRF Protection
Secure CORS Configuration
HTTPS-Only Production Access
Idempotency Key Protection
Duplicate Submission Prevention

Supabase and Database Security
Public and Server Client Separation
Service-Role Key Protection
RLS Enabled on Exposed Tables
Least-Privilege RLS Policies
Secure Database Functions
Restricted SECURITY DEFINER Functions
Safe Function search_path
Restricted Function Grants
Foreign Key Constraints
Check Constraints
Unique Constraints
Atomic Database Transactions
Row Locking
Record Versioning
Race Condition Protection
Append-Only Transaction Ledgers
Cross-Property Relationship Validation

Workflow Security
Secure Requisition Workflow
Secure Approval Workflow
Secure PO Workflow
Secure PO Overwrite Workflow
Secure GRN Workflow
Duplicate GRN Prevention
Over-Receiving Prevention
Inventory Balance Protection
Negative Inventory Prevention
Secure Transfer and Issuance Workflow
Secure Month-End Posting
Secure Price and Discount Validation
Secure Financial Total Calculation
Immutable Version History

Storage and File Security
Private Supabase Storage Buckets
Storage Row Level Security
Property-Scoped Storage Paths
Signed File Download URLs
File Type Validation
File Signature Validation
File Size Validation
Server-Generated File Names
Executable Upload Prevention
File Ownership and Entity Validation
Upload and Deletion Audit Logs

Realtime Security
Authorized Realtime Channels
Property-Scoped Realtime Access
Sensitive Metadata Protection
Limited Subscription Scope
No Realtime Authorization Bypass

Audit and Logging Security
Append-Only Audit Logs
Login Activity Logs
Role and Permission Change Logs
Approval Activity History
Purchase Order Version History
Inventory Transaction History
Unauthorized Access Attempt Logs
Request and Correlation IDs
Audit Log Modification Prevention
Sensitive Data Logging Prevention
Token and Secret Logging Prevention

Error and Response Security
Safe Error Message Handling
Standard Error Codes
No Stack Trace Exposure
No SQL Error Exposure
No Database Schema Exposure
No RLS Policy Detail Exposure
No Secret Exposure
Sensitive Response Field Filtering

Browser, Cookie, and Header Security
Secure Cookie Configuration
SameSite Cookie Protection
Secure Session and Token Handling
Content Security Policy
X-Content-Type-Options
Frame Protection
Strict Transport Security
Referrer Policy
Permissions Policy Where Appropriate

Secrets and Environment Security
Secure Environment Variables
No Secrets in NEXT_PUBLIC Variables
No Committed Environment Files
Secret Rotation Procedures
Separate Development, Staging, and Production
Protected Supabase Dashboard Access
Least-Privilege External Service Credentials

Migration and Data Protection
Legacy Data Backups
Browser localStorage Export
Migration Batch Tracking
Migration Checksums
Idempotent Imports
Duplicate Import Prevention
Cross-Property Import Validation
Financial Reconciliation
Inventory Reconciliation
Read-Only Legacy Fallback
Migration Rollback Procedure
No Dual Writable Data Sources

Operational Security
Dependency Vulnerability Scanning
Secret Scanning
Backend Endpoint Security Review
RLS Policy Testing
Cross-Property Access Testing
Role and Permission Testing
Concurrency Testing
Backup and Recovery Procedures
Monitoring and Alerts
Database and Storage Backup Verification
Incident Response Documentation
```

## Boundaries

- Don't invent an authentication system where none exists — flag it as a Critical finding and ask how the user wants to handle it (Supabase Auth, NextAuth/Auth.js, a custom JWT scheme, etc.) rather than picking one unprompted.
- If the project already uses Supabase Auth, don't add a second authentication system.
- Don't remove features to make an endpoint "safer" (e.g., don't strip a legitimate bulk-update capability instead of fixing its authorization check).
- Don't weaken business rules to make tests pass.
- Don't rely on hidden frontend buttons as authorization.
- Don't trust client-provided roles, permissions, user IDs, sender IDs, property IDs, approval limits, prices, statuses, or ownership fields.
- Don't assume RLS is correct merely because it is enabled.
- Don't expose the Supabase service-role key in browser code, public environment variables, logs, documentation, or reports.
- Don't paste secrets you find into the report or into new code — if you find a hardcoded credential, flag its location and tell the user to rotate it; don't reproduce the value.
- Don't use one blanket rate limit for every endpoint.
- Don't use an in-memory limiter as production protection on serverless or edge deployments.
- Don't allow direct client updates to inventory balances, append-only audit records, approval history, or protected financial totals.
- Don't silently guess approval authority, self-approval rules, financial visibility, negative-stock policy, property-retention rules, or document access.
- Don't delete JSON files, localStorage data, or legacy records until migration reconciliation, business signoff, and rollback procedures are complete.
- Don't allow Supabase and localStorage or JSON to remain writable for the same module during migration.
- Don't mark a backend production-ready when the full project configuration, dependencies, migrations, environment, or required tests were unavailable.
- If the codebase uses a stack outside Next.js API routes or Supabase (e.g., Express, NestJS, Laravel, WordPress REST, MongoDB, Firebase), the same checklist categories still apply, but the code-level examples and implementation patterns must be adapted to the actual framework instead of pasting Next.js or Supabase-specific code into a different stack.
