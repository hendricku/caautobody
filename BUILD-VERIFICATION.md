# Build Verification Notes

## Scope checked

- Next.js App Router project structure is present.
- Public route coverage matches the current CA Autobody sitemap structure used for this migration.
- Admin routes are separated under `/admin`.
- Gallery public UI uses the same `GalleryContent` model as the admin gallery mock.
- Google tag integration is environment-variable driven.
- Supabase folder is intentionally a backend handoff boundary for the next phase.

## Local verification commands

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

The source package intentionally excludes `node_modules` and `.next` so the ZIP remains clean and portable.
