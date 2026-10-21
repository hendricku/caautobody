# CA Autobody CMS — Phase 3 implementation

**Scope:** October 21, 2026; admin dashboard and its authenticated image-upload route only. This package is based on the Phase 2 premium floating-sidebar / bento-gallery source ZIP.

## Changes implemented

### Smart CMS image upload

- `src/components/Admin/CmsImageField.tsx`: replaces SweetAlert upload dialogs with a shared dropzone, inline errors, stages (optimize / upload), transfer progress, thumbnail preview, and original→optimized byte-size feedback.
- `src/lib/cms/image-upload-client.ts`: browser resize/compress to WebP before upload to avoid normal serverless request-body limits. Profile by placement (hero, featured, content, gallery, logo). Preserves image aspect ratio and alpha.
- `src/lib/cms/image-optimization.ts`: Sharp validates decoded image type, pixel count and frames, applies EXIF orientation, drops EXIF metadata, resizes without enlarging, and outputs WebP. Supports JPEG/PNG/WebP/AVIF and HEIC/HEIF **where the browser and Sharp build can decode them**.
- `src/app/api/admin/media/route.ts`: preserves same-origin, session, storage-bucket and rate-limit guards; accepts browser-optimized payloads and returns actual WebP dimensions and byte sizes.
- Profiles: hero max 2560 px; featured 2100; article/content 1920; Gallery 2200; logo 1400. All are max *long edges*, **not destructive crops**. The existing website components determine their own display frames.
- Browser original-file resource ceiling: 32 MB / 100 megapixels. Browser transfer target <=3.5 MB; authenticated server transfer ceiling 4 MB. Output WebP <=4 MB (below existing 5 MB private staging bucket limit). These are necessary security/infrastructure limits, not an assertion of arbitrary resolution/file-size support.
- Existing staging/promotion behavior is unchanged. Image URLs pasted into the field aren't automatically downloaded or recompressed; only uploaded files use the optimization pipeline.

### CMS synchronization

- `src/lib/cms/cms-sync.ts`: announces successful mutations using local window events and a non-sensitive localStorage hint. No CMS rows, customer details or tokens are broadcast. Receivers **refetch** through their existing authorization-controlled APIs.
- `src/lib/cms/useCmsCollection.ts`: updates after confirmed save, duplicate or delete, when matching same-browser tabs signal a write, on publication-version notifications, and every ~12s while visible (fallback for remote draft edits or a disconnected live channel).
- `src/components/Admin/AdminLiveSync.tsx`: refreshes SSR dashboard counts while visible; validates remote publication-version changes via the existing public version endpoint and listens for the existing Supabase `cms-publication` event where configured.
- Gallery Save Layout announces only **after** its authenticated order API succeeds; existing `/gallery` `revalidatePath()` is retained.
- Contacts, Audit, topbar enquiry counts and settings have background refresh; settings protects unsaved local form changes instead of replacing them with remote values.
- Current public `CmsLiveRefresh`, `/api/public/content-version`, public page components, and the existing publication-state database migration were **not edited**.

## Important behavioral boundaries

1. Dashboard and same-browser admin sessions receive immediate change hints after successful mutations. Draft changes from **another user** may take a polling cycle to appear (near-real-time, not guaranteed instant).
2. Published pages are revalidated using existing CMS API routes. Already-open public visitor pages rely entirely on the **existing** publication-version listener, database trigger, and runtime deployment; there is no new visitor-side code.
3. Incoming server data updates list snapshots but never directly replaces a locally edited form. Editing conflicts still need human reconciliation; there is no collaborative rich-text locking.
4. Gallery retains the existing public bento grid, saved `sort_order`, and combined preview. No database migration is introduced by Phase 3.
5. Google Analytics data reflects provider reporting latency and was not modified.

## Files and deployment

This upload is source-only: the supplied archive has no package manifest, lockfile, lint config, or installed project dependencies. Copy into the **complete original repository**, preserving its package manager and `.env` settings. Do not overwrite running production code until staging tests pass.

Suggested staging checks: `npm ci` (or repository-equivalent), existing ESLint command, `tsc --noEmit`, `next build`, and authenticated browser flows. If deployed on Vercel, test a 20 MB original image through the browser, not a direct oversized POST (browser-side precompression is intentional). Check Supabase Storage policies, the existing publication-state trigger migration, and whether Sharp HEIC/AVIF decoder formats are enabled in that deployment. Confirm `Image optimized` displays actual bytes and doesn't cause data loss or edits to the public website.

## Regression checklist

- Sign in as Editor and Publisher/Admin; check session, RLS/role restrictions.
- Large landscape JPG (6000px+), portrait PNG with alpha, WebP, AVIF, unsupported HEIC, invalid/corrupt file, 32 MB+ file, and 100 MP+ image.
- Upload/replace/preview/save draft/publish each image-enabled module (Services incl. brand/media, Blogs incl. blocks, Offers, Areas and Gallery).
- Verify image references remain private as drafts and are promoted only by authorized published writes.
- Gallery: published bento arrangement, add photo, drag/reorder, Save Layout, switch admin tabs, public cache refresh, keyboard/touch grip fallback.
- Cross-browser admin saves and background tab wake-up; verify unsaved editor fields aren't clobbered.
- Dashboard counts, Contacts, Audit, settings, existing analytics reports/PDF, public page routes, mobile responsiveness.
- Test network loss, expired sessions, upload rate limits and concurrent Gallery reorders.

The accompanying `VALIDATION_RESULTS.md` separates tests run in this environment from staging checks still pending.
