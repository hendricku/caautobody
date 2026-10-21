# CA Autobody CMS — Phase 3.2 Right-Column Media Refinement

## Scope

Dashboard/admin editor UI only. **No public website files, database migrations, upload API routes or Supabase queries were modified** in this phase.

## Changes

1. Removed the large **Image placement** section from the Service main content canvas.
2. Added separate, compact, vertical right-column panels directly after Page Settings:
   - **Hero Background** — landscape 16:9 preview and WebP upload/replace/remove.
   - **Right-Side Image** — undistorted portrait/landscape preview and independent WebP upload/replace/remove, shown for Editorial and Brand layouts.
3. Kept the existing `CmsImageField` upload logic. Added a `variant="compact"` presentation so API requests, browser compression, Sharp processing, staged media URLs, validation and handlers remain unchanged.
4. Image URL editing is available from a collapsed disclosure, reducing clutter. Existing image URLs and references remain intact.
5. Service aside panels are one column at desktop/tablet/mobile widths, remain **non-sticky**, and scroll naturally. Main editor retains copy and page-layout sections.
6. Updated the Service/Brand layout helper text, in-dashboard handbook, and printable PDF manual.

## Limitations carried forward from Phase 3.1

Existing public `EditorialServicePage.tsx` and `BrandRepairPage.tsx` use fixed right-side image maps. The CMS can save independently uploaded right-side images, but a new right-side photo **will not replace the currently published public right-side image** until a separately approved public data-binding change. No public component was modified here.

## Staging tests after integrating with the complete repository

- Test the right-column cards for Standard, Editorial, BYD and Lexus layouts (Standard has only Hero Background).
- Upload, replace and remove each image independently. Try file selection, drag/drop and the optional direct URL input.
- Verify the original and optimized file-size confirmation, error state, save/publish, and private preview.
- Confirm the sidebar remains non-sticky, with the media cards below Page Settings at desktop, tablet and mobile widths.
- Confirm the public site source is unchanged and no right image is falsely described as live.
- Run ESLint, `tsc --noEmit`, production build and authenticated Supabase UI tests in the complete repository. Source-only archive excludes package.json, lockfile and dependency installation.
