# CA Autobody CMS Admin — redesign and deployment notes

## Scope

This ZIP contains the supplied October 21 CA Autobody source tree with an admin-only visual refresh. Existing public website pages, Supabase persistence, authentication, API routes, permission checks and database migrations have not been changed. The source archive did **not** include `package.json`, lockfiles, `.agents/skills` or local environment settings; the package must be placed into the original application repository before running the project.

## Changes

- Consolidated three admin style overrides into `src/app/admin-design-system.css`, imported from `src/app/layout.tsx`. All new presentation overrides are scoped to `.admin-root`; public website CSS is unchanged.
- Adjusted admin shell, profile placement, navigation and contextual Add New actions.
- Updated responsive forms, cards, status tabs, hover actions and full-page editors.
- Added presentation-only textarea automatic height resizing, without modifying field values.
- Added pointer drag handles to repeatable Service/Brand/Editorial sections, alongside move buttons. Existing drag-and-drop Blog builder is retained.
- Surfaced existing authenticated private Preview routes directly on content listings.
- Reworded Delete buttons and confirmation dialogs while leaving the original *soft-delete/retire* backend operation unchanged.
- Improved existing Analytics visuals and added browser-side `Export PDF` based on the same authorized GA4/GSC report as the CSV export. No analytics endpoint is modified.
- Expanded the in-app Notes & guide into a book-style CMS user manual.

## Preview rules

The preview links for blogs, services, offers, areas, gallery and FAQs open the existing authenticated preview route. They show the **most recently saved** version using the public site rendering components. An unsaved form state will *not* appear in the preview until saved. Saving a published record as a draft can change visibility; make a duplicate draft to safely test major public edits.

## Analytics PDF

The PDF export uses `src/lib/analytics/pdf-report.ts`, which generates a standalone PDF in the browser without new packages, public routes, credential changes or mock data. Export is disabled without an existing report. It displays the date range, GA4 overview, channels, devices, top pages, Search Console results and daily sessions. The existing server-mediated CSV export remains unchanged.

## Verification / limits

Before deployment, run the original repository's install, lint, TypeScript/build and E2E processes, then smoke-test using staging Supabase and reporting credentials. The supplied source-only ZIP has no manifest or installed dependencies, so this environment cannot certify a production Next.js build or live backend behavior. Review the visual layout at mobile, tablet and desktop sizes, plus all roles. No admin routes should be promoted to production without those checks.
