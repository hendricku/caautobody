---
name: no-ai-slop-design
description: Use whenever building a real website, landing page, portfolio, or marketing page, or any frontend surface where visual quality matters, especially if the person wants it to "not look AI-generated," avoid a "templated" or "generic" feel, look "premium," "editorial," or "Awwwards-level," or mentions purple gradients, em dashes, or a slop/vibe-coded look to avoid. Enforces a researched checklist of patterns that make AI output instantly recognizable (indigo/purple gradients, Inter-only type, eyebrow labels over every heading, em dashes, bento grids, glassmorphism, the hero-cards-logos-pricing-FAQ skeleton, buzzword copy), replaces them with a process modeled on how Awwwards/FWA juries score sites, and mandates full responsive behavior (mobile, tablet, desktop, fluid) plus deliberate motion via GSAP/ScrollTrigger, Lenis, or Framer Motion. Trigger proactively for any "build me a site/page/portfolio" request even without the words "AI slop", since that is the default failure this skill prevents.
---

# No AI Slop Design

You are not decorating a page. You are the reason a client hires a studio instead of typing a prompt into a template generator. Every AI-slop tell in this document exists because a model, possibly you on a different day, took the statistically safest option at each decision point instead of an intentional one. This skill's job is to force intentional choices at each of those points, backed by what actually separates award-recognized sites from generic ones, not by taste alone.

Read `references/ai-slop-patterns.md` before designing anything: it is the researched, sourced list of what to refuse by default. Read `references/motion-and-libraries.md` when you reach the animation pass. Read `references/responsive-and-images.md` when you reach layout and imagery. This file is the process that ties them together.

## Why this matters (the mechanism, briefly)

LLMs generate the statistical median of their training data. Tailwind's default `indigo-500` became so common in scraped templates that it became the "default" purple-to-blue gradient every model reaches for. Inter, Roboto, and system fonts dominate for the same reason. When a genuinely good site establishes a trend, it gets scraped and folded into the next round of training data within weeks, so what was distinctive one quarter becomes the generic tell the next. Y Combinator's design review of AI-built startup sites (Aaron Epstein and Raphael Schaad, 2026) landed on the same root cause across every site they looked at: the founder let the AI decide the look and feel instead of deciding it themselves and directing the AI to execute it. That is the one behavioral shift this skill asks of you: decide first, generate second, never the reverse.

This applies to copy as much as visuals. Em dashes, "in today's fast-paced world," "unlock/elevate/seamless/revolutionize," and eyebrow labels over every single heading are the copy-side version of the purple gradient. Individually fine, collectively a fingerprint. Treat writing and visual design as one discipline here: a page with a distinctive layout and slop copy still reads as AI-made.

## The process

### 1. Ground it in the actual subject, before touching color or layout

Name the real thing being built, who looks at it, and the one job the page has to do. If [[recent-work]] or other memory has relevant context about who this client is and what they've asked for before, use it. Generic briefs produce generic pages because there's nothing specific to differentiate against. If the brief is thin, invent one concrete detail about the subject's world (its materials, its actual competitors, the specific thing that makes it not interchangeable with the last five things you built) and build from that.

### 2. Decide the token system before generating anything

This is the step AI slop skips. Write down, in a few lines, before any code:
- **Color**: 4-6 named hex values, chosen for what they signal about *this* subject, not the palette that's fastest to reach for. If your instinct's first color is a blue-purple gradient, that is the signal to pick something else. Warm neutrals, high-contrast duotones, a single confident brand color against black or off-white, editorial grayscale with one spot color: anything with a point of view that isn't the LLM default.
- **Type**: a display face with actual personality, used sparingly, plus a body face that isn't also Inter. Geist, Söhne, Inktrap, a licensed or Google Fonts pairing with real character, anything besides the safest default. If the brief calls for luxury or editorial register, serif display faces (Cormorant, Canela, Fraunces) read as considered rather than templated.
- **Layout primitive**: one strong structural idea, repeated until it becomes the site's signature, rather than seven different card treatments each doing their own thing. Real award-winning sites tend to have one thing you'd screenshot and recognize instantly. Decide what that is here.
- **Signature move**: the single element this page gets remembered for.

Only after this system is written down do you start building, and everything you build has to trace back to a line in this system. If you can't justify a color or a layout choice by pointing at the token system, it's a default that snuck in.

### 3. Build image-driven, not text-and-icon-driven

Read `references/responsive-and-images.md` for the full treatment. In brief: a real photograph or piece of art running full-bleed does more work than a headline plus three icon boxes ever will, and it's the fastest way to look like a human designer made deliberate choices instead of assembling a template. Default to:
- A hero built around one strong image, illustration, or live visual moment, not a headline centered over a gradient blob.
- Full-bleed treatment where the image is the point (product shots, editorial photography, environmental portraits) rather than boxing everything into equal-sized cards.
- Real content over placeholder-shaped content. A stock photo of "diverse team laughing at laptop" is as much a tell as a purple gradient. If you don't have real photography, say so and either source something specific and unclichéd or design around typography and color instead of faking a photo shoot.

### 4. Make it move, deliberately, with real tooling

Read `references/motion-and-libraries.md` for setup code and the accessibility requirements. The short version: motion should come from one of GSAP + ScrollTrigger, Lenis (smooth-scroll layer, paired with GSAP or Framer Motion), or Framer Motion for React, not ad hoc CSS transitions bolted onto every element. But the YC design review's single biggest interaction complaint wasn't "no animation," it was uninvited animation: scroll-jacking, cursor-following lights, elements that fade in for no reason, hover effects that make things recede instead of respond. Before adding any animation ask what it's for. A page-load sequence, one scroll-triggered reveal that reinforces a real narrative beat, a hover state that gives real feedback: yes. Motion on every element because the library makes it easy: no. Silence is also a choice; plenty of award-level sites use almost no motion and win on typography and image quality alone.

Always respect `prefers-reduced-motion`. This is not optional polish. Treat it the same as you'd treat a broken layout on mobile.

### 5. Responsive across the full range, not three fixed breakpoints

Read `references/responsive-and-images.md` for the technical patterns (fluid `clamp()` typography, container queries, touch-target sizing). The brief here asked for mobile, tablet, and desktop, and the honest modern answer is: don't design three fixed states and gap between them. Design a fluid system that scales continuously, and treat 320px through 2560px+ as one continuous range you're testing across, not three screenshots.

### 6. Self-audit against the banned list before calling it done

Before showing the result, walk back through `references/ai-slop-patterns.md` and check the page against it category by category: color, type, layout skeleton, copy, interaction. If you find yourself justifying a choice with "but it looks nice" rather than "here's what it does for this specific brief," that's the AI-slop reflex reasserting itself. Swap it for something the token system actually calls for. Then check every heading for an eyebrow label. If more than one or two sections have one, or if any exist purely because it "looks modern," cut them. Read the copy out loud and cut every em dash, replacing it with a period, comma, or a rewritten sentence. Scan for the buzzword list in `references/ai-slop-patterns.md` and replace anything that survived.

## Restraint still matters

None of the patterns in the reference file are permanently forbidden. A purple gradient used because the brand's actual color is purple is a choice, not a tell. What's being refused is the *unconsidered default*, not the color or the layout itself. Spend real boldness on the one signature element the token system named, and keep everything else disciplined around it. A page that breaks every rule in the reference file to be maximalist on purpose reads as intentional; a page that quietly accumulates five of them by default reads as AI slop regardless of how much motion you added on top.
