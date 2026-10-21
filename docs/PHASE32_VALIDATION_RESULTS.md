# Phase 3.2 — Verification and release gates

## Checks executed in supplied source-only archive

- **TS/TSX syntax parsing:** all source files parsed with the installed TypeScript parser (no syntax errors).
- **CSS:** all CSS files parsed with PostCSS; the admin design stylesheet processed with Autoprefixer.
- **Source integrity:** changes are scoped to Service editor, shared admin media field, layout helper, admin-only stylesheet, handbook, PDF generator and release notes. All public website pages/components, existing API routes, Supabase queries and migrations match the prior source ZIP.
- **Field scope:** one hero upload for every Service variant, and a second independent right-side image uploader for Editorial/Brand only, with the existing `updateHeroBackground` / `updateRightImage` handlers.
- **Scroll behavior:** the settings column retains its prior non-sticky rules; the Service column is forced to one column even at tablet sizes.
- **Manual:** regenerated PDF from the new dashboard handbook content and checked printable layout.

## Must be completed in runnable local project before deployment

- ESLint, full `tsc --noEmit`, and `npm run build` (not available in source-only ZIP without package manifest and dependencies).
- Authenticated browser checks: file selection, drag/drop, uploading, replacing, removing, direct URL edits, draft save, preview and publishing in Service/Brand layouts.
- Confirm Supabase staged-media conversion/promotion and actual external image display.
- Test desktop/tablet/mobile widths and keyboard file-upload focus.
- Existing public right-hand image remains mapped to the old fixed image until separately authorized public binding change; do not advertise the upload as already affecting the published right panel.
