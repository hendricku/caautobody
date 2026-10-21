# CA Autobody CMS — Phase 3.1 Editor & Image Placement Refinement

**Scope:** Admin editors and authenticated CMS image-reference handling. No changes to public website components, styles, layouts, public APIs, or database migrations.

## Implemented

1. The Service editor has a dedicated **Image placement** section. **Hero Background Image** and **Right-Side Image** have independent uploader controls for Editorial and Brand layouts. The Standard layout continues to have a single image, matching its existing public structure.
2. Both image fields use the existing WebP-optimizing `CmsImageField` (browser pre-compression, Sharp normalization, private staging). The hero has a landscape preview; the right photo retains portrait/landscape proportions. Removing or replacing one image does not edit the other.
3. Brand Hero Background remains backed by the existing `presentation.data.heroImage` field, synchronized with the primary service `image` field. A duplicate legacy Brand hero uploader was removed from the inner Brand settings panel.
4. Optional right-side image references are saved inside the existing service `content_json` presentation object as `presentation.data.rightImage`. **No new database column or migration** is necessary. The authenticated save route validates this value with the existing safe-image validator and promotes staging images into `cms-public` only during authorized publishing.
5. Publishing/settings panels are **not sticky** on desktop, tablet, or mobile. Their existing button handlers remain unchanged. Preview and Save Draft are compact secondary actions, Publish/Update remains the dominant brass button, and Cancel is an understated text link. This applies to every editor using the shared `admin-editor__aside` class (Services, Offers, Areas, Blogs, FAQs, Gallery).
6. CMS on-screen handbook and 20-page PDF manual describe separate image controls, the normal-flow panels, and the current public mapping limitation.

## Public website image binding limitation — approval required

Existing Service `EditorialServicePage.tsx` selects the right hero image from a hardcoded `heroPanelByService` mapping. Existing `BrandRepairPage.tsx` does the same for BYD/Lexus from `media.heroPanels`. Those components do not consume the newly persisted `presentation.data.rightImage` field. **For this release, the right image is uploaded, stored and previewed in the admin, but it will NOT automatically appear in the published right panel.** This is intentional to honor the owner's strict instruction not to change the public website.

If the owner later authorizes a *data-binding-only* public component change, it must follow this contract:

- Editorial pages: use the saved `rightImage` (when present), otherwise keep existing `heroPanelByService` fallback.
- Brand pages: use the saved `rightImage` (when present), otherwise keep existing BYD/Lexus hero panel defaults.
- Keep the present HTML structure, CSS, sizing, overlays, and responsive layout completely unchanged. Do not substitute a right image for `service.image` / `data.heroImage`, which control the background.
- Verify draft preview, saved publish, and safe staging-to-public promotion before shipping the binding.

This limitation must not be described as a finished public right-image replacement feature.

## Release verification

- Run repository's real ESLint, TypeScript, tests, and production build after integrating into its complete source checkout.
- Check Services and both Brand variants with existing and newly uploaded hero / right-side photos.
- Confirm a right image URL is kept through draft → reload → publish and that the right asset gets a public URL; confirm the hero background value never changes unintentionally.
- Confirm publisher/editor permissions and failed promotion behavior using staging data.
- Check all admin module publishing panels on desktop and mobile remain in normal scrolling flow.
- Check public website files match the pre-update baseline.
