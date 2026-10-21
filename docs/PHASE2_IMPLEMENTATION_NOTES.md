# CA Autobody CMS — Phase 2 premium dashboard + bento gallery

## Implemented

- Replaced the basic dashboard with an enterprise content overview: live Supabase counters, compact metrics, publishing snapshot, library and resources links, and an intentional hero. Removed the oversized “Publication reminder” card.
- Refined the shared admin sidebar into a floating rounded panel with outer gutter and **hidden, still-scrollable navigation scrollbar**. Kept collapse/expand, active links, mobile drawer, sign-out and profile.
- Reduced Analytics panel whitespace without changing GA4/Search Console report fetch, calculations, dates, CSV export or PDF export. Grids now size cards to their actual contents rather than stretching adjacent panels.
- Kept reordering in Services, but made the up/down buttons visually hidden until focused by keyboard. The original handlers remain available and draggable grips still work.
- Replaced Gallery management list with a responsive **bento grid** using the same pattern of wide/tall/standard tiles as the public gallery (`BENTO_CLASSES`). Per-image Preview links on the collection page were removed; the page instead offers a combined **Preview gallery** modal showing Published photos or Published + Drafts privately.
- Gallery ordering changes can be staged via drag and drop on desktop, touch-drop on mobile, or arrow keys while focused on the grip. **Save layout** persists the order; **Discard** undoes local changes. Search/filter mode disables reordering to prevent accidental hidden-item displacement. Editor role sees a permission explanation; Publisher/Admin can reorder.
- Updated in-dashboard book-style guide and the reproducible 16-page A4 PDF manual.

## One isolated backend extension required for persistent ordering

`POST /api/admin/cms/gallery/reorder` is the only added API route. It accepts a validated, unique, complete list of active gallery `legacy_key` IDs, requires a same-origin authenticated Publisher/Admin request, checks current gallery membership, and updates **only the pre-existing `cms_gallery_items.sort_order` field**. It does not change images, status, authentication, Supabase migrations or any existing endpoint. It revalidates `/gallery`. A failed multi-row operation attempts best-effort rollback and instructs the user to refresh. The operation is **not database-transactional** and must be tested in staging before production.

No public website components/pages, migrations, existing API routes, or CMS persistence hooks were changed.

## Manual verification after integrating into the complete repository

1. `npm ci` (or the project's package manager); `npm run lint`; `npx tsc --noEmit`; `npm run build`.
2. Log in as Admin/Publisher and Editor. Confirm hidden sidebar scrollbar and expanded/collapsed/mobile navigation.
3. Dashboard: verify counts match actual content, links, and responsive cards.
4. Analytics: exercise filter periods, live GA4/Search Console, CSV, PDF, compact devices/top-pages panels.
5. Gallery: upload, draft, publish, edit, duplicate, delete, preview published-only and including drafts, drag/touch/keyboard reorder, discard, save, refresh, and live `/gallery` bento order. Test concurrent edits and API errors.
6. Services: reorder items and sections using drag controls and keyboard fallback; save, reopen, verify persistence.
7. Confirm the other Modules, permissions, auth, and public pages continue operating as before.

## Environment limitation

The supplied project archive was **source-only**, with no `package.json`, lockfile, installed dependencies, `.agents/skills` files, secrets, or live CMS session. Offline TypeScript parsing and CSS checks passed, but **a real ESLint run, typecheck, Next.js build, browser interaction test, and live Supabase verification could not be performed here**. Please do not deploy without completing the above checks against the original complete repository.
