# CA Autobody CMS — Phase 4 Execution Plan
## Reliable publishing, public data bindings, service ordering, security

**Scope:** Preserve visual layout, styling, animation, and public structure. Minimal public TSX changes are permitted only where a view is still hardcoded. Do not modify production database data or apply migrations automatically. Work from the Phase 3.2 CMS source-only package.

### Phase 4.1 — Baseline and content-flow audit
1. Trace each admin form field → authenticated write API → Supabase table → public reader → view/metadata.
2. Inventory every published/draft/retired boundary, fallback, image binding, static ordering list, and use of `revalidatePath`.
3. Compare published-state migration with the actual staging database before a release; verify RLS policies and Storage grants.
4. Record screenshot-and-record-level before/after checks for Services, Brands, Blog, FAQ, Gallery, Offers, Areas, Settings, homepage and navigation.

### Phase 4.2 — Fix actual public content precedence
1. Editorial Service uses `presentation.data` saved in the CMS, never an approved-brand bundled copy over it.
2. Right-side image honors a separately published `presentation.data.rightImage` and falls back to the existing hero-side stock photo when unset. Hero/background reference stays independent.
3. Brand page honors its explicit CMS `rightImage` and falls back to its existing Brand-specific image.
4. Services directory and the standard service renderer prefer published title, intro, and body; static content is a compatibility fallback only.
5. Homepage carousel reads CMS copy, title, image and placement; it retains its existing visual structure. Note that overriding the service image also controls the carousel image when no explicit carousel image field exists.
6. Other modules are already public-query-driven. Test rather than rewrite them without evidence.

### Phase 4.3 — Independent menu arrangement
1. New sidebar entry: Content → Menu arrangement (`/caautobodyadmin/menu-arrangement`).
2. Tabs: **Services Mega Menu** and **Homepage Services Slider**.
3. Order, hide/show, drag handle, position-select alternative, Save, Discard, navigation preview via View website.
4. Store both lists atomically in one `cms_site_settings` row (`service_arrangement`, `is_public=true`); no new table required.
5. Validate IDs, duplicate IDs, role and enabled/published status on server. Use revision/updated_at compare-and-set so concurrent editors receive 409 instead of silent overwrite.
6. Special static `prestige-brands` directory slide is allowed only in the Slider. Initially retain defaults until the first save. New services become available to add after publishing and enabling placement.

### Phase 4.4 — Real-time and cache correctness
1. After publisher writes, revalidate affected Next.js paths. Services/menu arrangement invalidate root layout (header + homepage slider).
2. Use the existing `cms_publication_state` trigger and `realtime.send` signal when installed. Public browser checks `/api/public/content-version` every 5 seconds as a fallback; only refresh if version changes.
3. Open visitor tabs update after validated version changes and `router.refresh`. This is near-real-time, **not guaranteed subsecond** or offline delivery; tests must establish actual latency under staging network conditions.
4. Draft writes must not change public version or public content. Avoid exposing private rows in WebSocket broadcast payloads.
5. Verify CDN/Supabase Storage caching after replacing media. Published uploads use unique immutable URLs to avoid stale browser image caches.

### Phase 4.5 — Security and reliability
1. Route authentication uses Supabase claims plus `cms_staff_role` RPC. Publisher/Admin only for publication and menu order. No service keys client-side.
2. Same-origin validation for mutations; JSON schema restrictions; read permitted published slugs before writing arrangement.
3. Resolve effective status and publisher permission **before** promoting staging media. Prevent orphaned public assets on rejected editor attempts.
4. Menu ordering is one record update. Reorder revisions reject stale saves (409). Public readers only select `is_public=true`.
5. Optional staging-first gallery-order SQL migration provides atomic `cms_reorder_gallery` RPC; until approved/applied, existing best-effort fallback remains. Do not pretend that fallback is transactional.
6. Log public-query failures so static fallbacks don't silently conceal broken Supabase reads. Confirm errors in server logs during staging.
7. Verify role matrix, deleted/unpublished IDs, unknown input, forged origin, schema drift, and concurrent editors.

### Phase 4.6 — Acceptance and staged release
1. Build complete repo with original `package.json` and lockfile; run `npm ci`, ESLint, `tsc --noEmit`, Next production build, tests, Playwright.
2. Two browsers: publish every module and compare public output, then leave an anonymous tab open and verify it refreshes without manual action.
3. Preview draft vs publish; separate Hero Background and Right-Side Image; carousel order independent from header; gallery bento reorder after page reload.
4. Staging SQL migration `20261022090000_atomic_gallery_order.sql` requires prior approval and separate deployment. Check migration-history drift before applying.
5. Release only after regression evidence. Update handbook; roll back through git if regressions occur.

### Definition of done
- Published Service edits reflected in Service detail/directory, Hero Background and Right-Side Image; no draft leakage.
- Menu and Slider independently sortable, persist after refresh; robust stale-revision 409.
- Published Gallery, Blog, FAQ, Offer, Area and Settings updates pass end-to-end checks.
- Visitor's **open tab** refreshes under normal connected conditions; measured staging latency documented.
- All existing public CSS/HTML structure remains intact and responsive.
- No critical/major regressions, no ESLint/TS errors, passing build; unresolved tests accurately flagged.

### Known execution limits of this package
The uploaded archive lacks package.json, lockfile, .env and installed dependencies. Only source-level tests are possible here. Staging database migrations, RLS, authenticated workflows, cache propagation, Playwright and production build must be verified in the full project before claiming completion. No live Supabase or production modifications were made.
