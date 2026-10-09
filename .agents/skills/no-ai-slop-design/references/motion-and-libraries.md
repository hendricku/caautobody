# Motion and libraries

Use this file when you reach the animation pass. It covers which library fits which situation, how to wire them together correctly, and the accessibility requirement that applies no matter which you pick.

## Choosing a library

- **Plain HTML/CSS/JS site, scroll-driven storytelling, timeline control (pause, scrub, reverse):** GSAP + ScrollTrigger. This is the industry-standard combination for scroll-linked animation and gives precise timeline control that CSS alone can't.
- **Any site that should feel like scrolling through still water rather than a native scrollbar:** add Lenis as the smooth-scroll layer underneath whichever animation library you're using. Lenis wraps native scroll rather than replacing it, so `position: sticky`, anchor links, and accessibility tooling keep working. That's why it displaced older approaches like Locomotive Scroll, which rewrote scroll behavior more invasively.
- **React app:** Framer Motion (now published as "Motion") for component-level animation: mount/unmount transitions, gestures, layout animations, shared-element transitions. Pair with Lenis for smooth scroll if the app needs scroll-linked effects; GSAP ScrollTrigger also has a first-class React/Framer adapter if you need GSAP's timeline precision inside a React app.

Don't reach for all three by default. Pick the smallest combination that does what this specific brief needs. A single-page marketing site with a few scroll reveals doesn't need Framer Motion; a data-heavy React dashboard with list transitions doesn't need Lenis.

## GSAP + ScrollTrigger + Lenis wiring

The critical detail: Lenis and GSAP must share one animation loop, or ScrollTrigger positions will jitter by a frame or two against the smoothed scroll position.

```javascript
import Lenis from 'lenis'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const lenis = new Lenis()

// Keep ScrollTrigger in sync with Lenis's smoothed scroll position
lenis.on('scroll', ScrollTrigger.update)

// Drive Lenis off GSAP's own ticker so both run on one rAF loop
gsap.ticker.add((time) => {
  lenis.raf(time * 1000) // GSAP ticker is in seconds; Lenis expects ms
})

// Let Lenis own frame timing, since GSAP's own lag smoothing would otherwise fight it
gsap.ticker.lagSmoothing(0)

// Now ScrollTrigger-based animations work as usual
gsap.to('.reveal-target', {
  scrollTrigger: {
    trigger: '.reveal-target',
    start: 'top center',
    end: 'bottom top',
    scrub: true,
  },
  opacity: 1,
  y: 0,
})
```

Package: `npm install gsap lenis`. For React, import the wrapper from `lenis/react` rather than the deprecated `@studio-freight/react-lenis`.

Minimal drop-in version with no build step, for static HTML:

```html
<link rel="stylesheet" href="https://unpkg.com/lenis@1.3.25/dist/lenis.css">
<script src="https://unpkg.com/lenis@1.3.25/dist/lenis.min.js"></script>
<script>
  new Lenis({ autoRaf: true, autoToggle: true, anchors: true })
</script>
```

## Framer Motion (Motion) patterns

Animate `transform` properties and `opacity`, since these are GPU-composited and don't trigger layout recalculation. Avoid animating `width`, `height`, `top`, `left`, `padding`, or `margin` directly; animate `x`/`y`/`scale` instead.

```jsx
// Cheap: GPU-composited, no layout recalculation
<motion.div animate={{ x: 50, scale: 1.1, opacity: 0.8 }} />

// Expensive: triggers layout on every frame, avoid this
<motion.div animate={{ width: '200px', left: '50px' }} />
```

Use `AnimatePresence` for exit animations. Without it, unmounted elements simply disappear with no transition:

```jsx
<AnimatePresence>
  {items.map(item => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {item.content}
    </motion.div>
  ))}
</AnimatePresence>
```

Use variants for anything with more than one or two animated children, so timing and easing live in one place instead of being repeated per element.

## Accessibility: prefers-reduced-motion is not optional

Treat this the same as a broken mobile layout. A page that ignores it is unfinished, not "done except for polish."

**Framer Motion**, global setting via `MotionConfig`:

```jsx
import { MotionConfig } from 'framer-motion'

function App() {
  return (
    <MotionConfig reducedMotion="user">
      {/* transform/layout animations auto-disable when the user has
          requested reduced motion; opacity and color animations
          still run, so state changes remain visible */}
      <YourApp />
    </MotionConfig>
  )
}
```

Or per-component, when you need custom behavior:

```jsx
import { useReducedMotion } from 'framer-motion'

function AnimatedCard() {
  const shouldReduceMotion = useReducedMotion()
  return (
    <motion.div
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
    />
  )
}
```

**GSAP / plain CSS**, via the media query directly:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(100) // effectively skip animated transitions
  // or: skip ScrollTrigger scrub/pin effects and reveal content in its final state directly
}
```

The rule either way: reduced motion means the animation is skipped or shortened to near-zero, and it must never mean the element fails to appear at all. If an animation currently reveals content that starts at `opacity: 0`, and the reduced-motion path is just "remove the animation," check that the content still ends up visible.

## What "deliberate" motion looks like in practice

- One orchestrated page-load sequence rather than every element having its own random fade-in.
- A single scroll-triggered reveal that reinforces a real narrative beat in the content, not applied uniformly to every section by default.
- Hover states that respond (scale up slightly, brighten, show more information) rather than recede or blur.
- Parallax used sparingly and only where depth genuinely serves the subject (product photography, environmental imagery), not as ambient decoration on every section.
- No scroll-jacking: native scroll stays native. Lenis smooths it; it doesn't hijack it for a forced animation sequence the user can't skip past.
