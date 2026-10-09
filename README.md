# CA Autobody — Next.js Frontend + Admin Mock

Production-oriented frontend rebuild based on the approved CA Autobody V4 homepage direction.

## Included

- Next.js App Router + TypeScript.
- V4 homepage rebuilt as React components.
- Public routes for About, Insurance, Services, all current service routes, Offers, all current offer routes, Areas We Serve, all current location routes, Blog, Gallery, Contact, FAQ, Sitemap and Thank You.
- Gallery uses a responsive clickable bento layout with an immersive keyboard-accessible lightbox, category filters, previous/next navigation and mobile handling.
- FAQ content is centralized on the dedicated FAQ route instead of repeated on service/location pages.
- Responsive site header, mega navigation, footer and mobile navigation.
- Responsive admin UI with Dashboard, Blogs, Services, Gallery, FAQ, Analytics and Settings.
- Mock CRUD persistence through localStorage for admin content management.
- Analytics UI backed by a mock AnalyticsService interface, ready to swap to GA4 Data API + Search Console API later.
- Google Tag Manager/GA4 integration-ready via environment variables.

## Backend status

Backend is intentionally deferred. Admin CRUD currently uses localStorage and uploaded gallery files use temporary browser object URLs. Supabase/Auth/Storage and real Google API access are the next backend phase.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 and http://localhost:3000/admin/dashboard.

## Google tags

Set `NEXT_PUBLIC_GTM_ID` and/or `NEXT_PUBLIC_GA4_ID` in `.env.local`. The integration is handled in `src/components/Common/GoogleTags.tsx` and does not require WordPress Site Kit.

## Content migration note

The routing/content layer is centralized in `src/lib/siteContent.ts` so final approved SEO copy can be migrated 1:1 without changing the page layouts or components.
