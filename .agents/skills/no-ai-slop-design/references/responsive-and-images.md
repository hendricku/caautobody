# Responsive and image-driven design

Use this file for the layout and imagery pass. Two things this skill asks for specifically: the layout has to work continuously across the full range from small phone to large desktop (not just look fine at three fixed breakpoints), and the design should be built around real images rather than icon-and-card compositions.

## Responsive: fluid, not just multi-breakpoint

Three fixed screenshots (mobile / tablet / desktop) leave dead zones in between where nothing was actually designed. The modern baseline is a fluid system that scales continuously, with breakpoints reserved for genuine structural changes (a nav collapsing to a hamburger, a grid changing column count) rather than for resizing text and spacing.

**Fluid typography with `clamp()`**, scaling smoothly between a minimum and maximum instead of jumping at breakpoints:

```css
h1 {
  /* minimum 28px, scales with viewport width, caps at 56px */
  font-size: clamp(1.75rem, 4vw + 0.5rem, 3.5rem);
  line-height: clamp(1.2, 4vw + 0.5rem, 1.3);
}

body {
  font-size: clamp(0.875rem, 0.5vw + 0.8rem, 1.125rem);
}
```

**Fluid spacing**, same approach, so padding and gaps don't need per-breakpoint overrides:

```css
.section {
  padding-block: clamp(2rem, 6vw, 6rem);
  gap: clamp(0.5rem, 2vw, 1.5rem);
}
```

**Container queries** for components that need to respond to their own container's width, not the viewport. Critical for anything that can appear in more than one layout context (a card in a sidebar vs. the same card in a full-width grid):

```css
.card-container {
  container-type: inline-size;
}

@container (min-width: 380px) {
  .card {
    grid-template-columns: 120px 1fr;
  }
}
```

**Never use raw `vw` for font size without a `clamp()` floor and ceiling.** Unclamped viewport units produce unreadable text on small screens and oversized text on large ones.

**Touch targets:** minimum 44x44px for anything tappable on mobile. Smaller targets fail usability testing on real devices even when they look fine in a desktop browser at a shrunk viewport width.

**Test across the actual range**, not just three device presets: 320px (small phone), roughly 768px (tablet portrait), roughly 1024-1280px (laptop), 1536px+ (large desktop), and the awkward in-between widths (500-650px, 900-1000px) where fixed-breakpoint layouts most often break.

**Don't collapse desktop navigation into a hamburger menu just because it's a habit.** If there's enough horizontal space to show the nav items, show them. Hiding available navigation behind a hamburger on a wide viewport reduces discoverability for no reason.

## Image-driven design

A hero built from a headline, a subhead, and an icon grid is the fastest way to look like every other AI-assisted landing page. A hero built around one real, specific image does more communicative work and is much harder to make look generic.

**Hero patterns that work:**
- Full-bleed photography or art filling the viewport, with a minimal headline and single CTA overlaid. Works best when the brand has a genuinely strong visual identity and one clear story to tell (fashion, hospitality, travel, food, any lifestyle-driven brand).
- Split layout: full-bleed image on one side, headline/copy/CTA on the other. A strong default when you need the image to carry emotional weight but still want text to read cleanly against a plain background rather than over the image.
- A live demo, interactive moment, or short native-feeling animation in place of a static hero image, when the product itself is the most characteristic thing to show.

**On mobile, don't just scale the desktop hero down.** Stack the image full-width above the fold, then recompose headline/description/CTA below it on a plain panel. This respects a thumb-scrolling reading pattern instead of cramming a wide-format composition into a narrow viewport. If the hero image has a specific focal point (a face, a product), crop a dedicated vertical/mobile asset rather than relying on automatic scaling to keep that focal point centered.

**Full-bleed treatment in the body of the page:** don't squander a strong image by boxing it into a corner of a text-heavy section, and don't dilute one great image's impact by surrounding it with several mediocre ones. Confidence in picking the single best asset and running it large usually beats using more images at smaller size.

**Real photography over stock, stock over nothing, nothing over generic AI-slop stock.** A specific, well-art-directed photograph of the actual subject (the actual product, the actual space, the actual people involved) beats generic stock every time. If real photography genuinely isn't available, it's better to lean on strong typography and color than to fill the gap with the visual equivalent of a purple gradient. An interchangeable stock photo of a diverse team laughing at a laptop communicates nothing about this specific subject.

**Gestalt basics still apply regardless of screen size:** group related items with proximity, keep a clear reading path (type hierarchy tells the eye what to read first, second, third), and alternate image-heavy sections with lighter/text-focused ones so the page has pacing rather than either a wall of text or an unbroken scroll of visuals.
