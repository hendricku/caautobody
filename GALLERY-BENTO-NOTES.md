# Gallery Bento + Lightbox

The public `/gallery` route now uses a responsive dense bento grid.

## Included interaction
- Variable bento card sizes on desktop/tablet.
- Fully clickable images.
- Full-screen lightbox.
- Previous/next controls.
- Keyboard navigation: Left, Right, Escape.
- Body-scroll lock while the lightbox is open.
- Category filtering with counts.
- Mobile fallback that keeps imagery readable instead of aggressively cropping it.
- Accessible button labels and focus states.

The admin `/admin/gallery` module continues to manage the same `GalleryContent` records, so the public bento gallery is ready to consume Supabase-backed gallery records later without changing the UI component.
