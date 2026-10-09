# CA Autobody Project Map

## Public website

- `/` — V4 homepage converted to Next.js.
- `/about`
- `/insurance`
- `/services`
- `/services/accident-assistance`
- `/services/paintless-dent-removal`
- `/services/panel-beating`
- `/services/replacement-vehicles`
- `/services/spray-painting`
- `/services/tesla-approved-repair-centre`
- `/services/services-zeekr-approved-repairer-melbourne`
- `/offers`
- `/offers/byd-approved-repairer-melbourne`
- `/offers/fleet-and-commercial-repairs`
- `/offers/lexus-approved-body-shop-melbourne`
- `/offers/not-at-fault-accident-repairs`
- `/offers/tesla-approved-body-shop-melbourne`
- `/offers/zeekr-authorised-repairer-melbourne`
- `/areas-we-serve`
- `/areas-we-serve/aspendale`
- `/areas-we-serve/braeside`
- `/areas-we-serve/carrum`
- `/areas-we-serve/chelsea`
- `/areas-we-serve/cheltenham`
- `/areas-we-serve/edithvale`
- `/areas-we-serve/mentone`
- `/areas-we-serve/mordialloc`
- `/areas-we-serve/parkdale`
- `/areas-we-serve/sandhurst`
- `/blog`
- `/blog/ca-knows`
- `/blog/client-stories`
- `/blog/[slug]`
- `/gallery` — responsive clickable bento grid + fullscreen lightbox
- `/frequently-asked-questions`
- `/contact`
- `/sitemap`
- `/thank-you`
- `/sitemap.xml`
- `/robots.txt`

## Admin modules

- `/caautobodyadmin/login` — passwordless email OTP mockup
- `/caautobodyadmin/dashboard`
- `/caautobodyadmin/blogs` — local mock CRUD, pending secure data migration
- `/caautobodyadmin/services` — local mock CRUD, pending secure data migration
- `/caautobodyadmin/gallery` — local mock upload/CRUD, pending Storage migration
- `/caautobodyadmin/faq` — local mock CRUD, pending secure data migration
- `/caautobodyadmin/analytics` — mock GA4/Search Console interface
- `/caautobodyadmin/team` — browser-local administrator and audit mockup
- `/caautobodyadmin/settings` — integration/backend readiness

## SEO and migration architecture

- Existing public slugs are represented wherever they are confirmed in the current site structure.
- Redirect aliases are included for `/blogs` and historical Zeekr routes.
- FAQ content is centralized on the dedicated FAQ page.
- Admin routes are blocked in `robots.txt`.
- `sitemap.xml` is generated from the same content registry used by the frontend.
- GTM / GA4 are environment-variable driven; WordPress Site Kit is not required.

## Backend boundary

All admin modules are frontend mockups. OTP, administrator profiles, audit history and content changes are browser-local previews only; no real authentication or shared database is connected.
