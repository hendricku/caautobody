# AI Slop Patterns: the researched list

This file compiles patterns identified across design blogs, dev communities, a Y Combinator design review, and documented "AI tells" research through mid-2026. Treat it as a checklist to run every design against, not a list to memorize and recite. The point is recognizing the reflex in your own output, not cataloguing examples.

## 1. Color and surface

- **Indigo/violet-to-blue gradients as the default "modern" background or accent.** This traces to Tailwind CSS's `indigo-500` becoming the most common accent color in the scraped templates and UI kits that trained most coding models (Tailwind's own creator publicly joked about it). The result: buttons, hero backgrounds, card fades, and nav bars all converge on the same blue-purple family regardless of what the brand actually is.
- **Neon-on-dark as the second-most-common default**: cyan or violet glow on near-black, often with a glowing gradient "orb" floating behind the hero. This is sometimes called the "v0/Cursor signature."
- **Glassmorphism on everything**: frosted-glass card treatment, popular around 2022, now the reflexive default whenever a model is asked for something that looks "modern" or "premium."
- **Permanent dark mode as the unexamined default**, applied whether or not it suits the brand or content type.
- **A thick colored border on one side of an otherwise plain rounded card**: repeatedly flagged as one of the single most recognizable AI tells, precisely because it signals "accent" without costing any real design decision.
- Fix: choose a palette because of what it signals about *this* subject, and state that reason. Warm neutrals, high-contrast duotone, a single confident brand color against black or off-white, editorial grayscale with one spot color: anything with a point of view.

## 2. Typography

- **Inter, Roboto, Arial, or unstyled system fonts used for both display and body text.** These are the most common fonts in scraped training data, so they're the safest statistical default, which is exactly why they read as generic. Pairing Inter with Inter for both headline and body is a stronger tell than using Inter alone.
- Fix: a display face with real character, used with restraint, paired with a body face that isn't the same family. Geist, Söhne, Untitled Sans, Migra, Inktrap, or a well-chosen serif for editorial/luxury registers (Cormorant, Canela, Fraunces) all read as considered rather than templated.

## 3. Layout skeleton

- **The canned full-page sequence**: hero, three feature cards with icons, logo strip ("valued and trusted by"), pricing, FAQ, footer, shipped essentially unchanged regardless of what the product actually is.
- **Bento grids reached for by default** rather than because the content is genuinely modular in a way that benefits from that shape.
- **Three (or seven) rounded feature cards, each with a centered icon in a circle**, uniform border-radius, uniform shadow: the layout equivalent of the purple gradient.
- **Cards nested inside cards inside cards**, each with its own padding and shadow, several levels deep.
- **A numbered sequence (01 / 02 / 03) used as decoration** even when the content isn't actually an ordered process. Numbering should encode something true about the content, not simulate structure.
- **"Eyebrow" text, a short label sitting above nearly every heading**, used reflexively rather than because a specific section genuinely needs the extra context. Eyebrow labels have a legitimate use (framing a section before the reader hits the headline, aiding scanning, giving screen-reader structure), but the tell is *frequency*: real editorial and product sites use them sparingly, on sections that specifically benefit, not above every single heading on the page. If a heading is already clear on its own, adding a small label above it is decoration, not information. Cut it.
- **A generic "fake dashboard" screenshot** with red/yellow/green/blue callout icons in the Fisher-Price primary palette, flagged repeatedly as one of the most obvious hallmarks of AI-generated product visuals.
- Fix: pick one strong layout primitive for the page and repeat it until it becomes the site's visual signature, rather than reaching for a different generic treatment per section.

## 4. Interaction and motion

Drawn largely from a Y Combinator design review (Aaron Epstein and Raphael Schaad, 2026) auditing real AI-built startup sites. The review's core finding was that unrequested, purposeless motion was a bigger and more common problem than static visual clichés. Specific patterns to avoid:

- A line or glow that follows the cursor down the page for no communicative reason.
- Automatic fade-ins applied uniformly to every section on scroll, regardless of whether that section benefits from a reveal.
- Buttons or UI elements that shift position or "wiggle" without being triggered by a real interaction.
- Hover effects that make an element recede, blur, or fade: the opposite of what a hover state should communicate (that something is interactive and responsive).
- **Scroll-jacking**: hijacking native scroll to force a JavaScript-driven animation sequence. This was the single most-flagged interaction problem in the YC review; reviewers repeatedly lost track of the product's actual message because the animation captured all their attention.
- Motion added because a library makes it trivial, not because a specific beat in the page's narrative calls for it.
- Fix: before adding any animation, name what it's for. A deliberate page-load sequence, one scroll-triggered reveal that reinforces a real point, a hover state that gives honest feedback: yes. Motion by reflex on every element: no. Always respect `prefers-reduced-motion` (see `motion-and-libraries.md`).

## 5. Structure and messaging (beyond pure visuals)

Also from the YC review. These aren't visual tells, but they compound with the visual ones:

- **Weak or vague value proposition**: the page looks polished, but a visitor still can't tell what the product does, who it's for, or why they should care.
- **Too many competing text styles and decorative labels** that add visual weight without adding meaning.
- **Visually inconsistent sections** that read as if each was generated independently rather than as part of one coherent brand system.
- **Letting the AI decide brand direction** instead of setting the direction first and directing execution against it: the review's identified root cause behind every other category on this list.

## 6. Imagery

- **Generic stock photography**, "diverse team laughing at a laptop" and equivalents, is as much a tell as a purple gradient. It signals no one made an actual decision about how to represent this specific subject.
- **Floating abstract 3D blobs or too-smooth plastic illustrations** used as filler when there's no real content to show.
- Fix: build the page around real, specific photography or art wherever possible. A full-bleed image with a real point of view outperforms an icon grid every time. See `responsive-and-images.md` for layout treatment.

## 7. Copy and writing

Em dashes and certain phrases became associated with AI-generated text specifically because early models used them far more frequently than typical human writing, and that pattern got reinforced through repeated public callouts. It's now recognized widely enough that overuse reads as a tell regardless of the actual source. Treat this the same as the visual list: not forbidden outright, but a signal to rewrite when it shows up by reflex rather than by choice.

**Cut every em dash.** Replace with a period, a comma, or a rewritten sentence. This applies to any copy generated for the page: headlines, body text, microcopy, alt text.

**Openers to avoid:**
- "In today's fast-paced world / digital age / modern era..."
- "In the era of..."

**Verbs that read as filler because they can describe almost anything:**
unlock, unleash, elevate, supercharge, turbocharge, amplify, revolutionize, transform (without naming the specific change), delve, dive in, embark, navigate, uncover, unveil, craft/crafting, tailor/tailored, hone, harness, leverage (as a verb), foster, enhance, engage/engaging.

**Adjectives that signal nothing because they're used so broadly:**
seamless, cutting-edge, innovative, powerful, game-changing, revolutionary, stellar, exceptional, unparalleled, dynamic, intricate, nuanced, holistic, paramount, vital, formidable, imaginative, nimble, scrappy.

Fix: say the specific thing instead of the impressive-sounding abstraction. "Unlock your team's potential" says nothing; "cuts your invoicing time from two hours to ten minutes" says something. If a sentence still makes sense with the buzzword deleted, delete it.

## Self-audit checklist

Run this against the finished page before calling it done:

- [ ] No blue-purple/indigo gradient used as an unexamined default (a genuine brand purple is fine, reflexive purple is not)
- [ ] Display and body type are not both Inter/Roboto/system-default
- [ ] No more than one or two sections use an eyebrow label, and each one earns its place
- [ ] Layout isn't the hero, 3 icon-cards, logo strip, pricing, FAQ skeleton unless the content genuinely calls for it
- [ ] No cards nested inside cards inside cards
- [ ] No numbered markers (01/02/03) unless the content is a real sequence
- [ ] Every animation has a stated purpose; none exist just because the library made them easy
- [ ] No scroll-jacking, cursor-following elements, or hover states that make things recede
- [ ] `prefers-reduced-motion` is respected
- [ ] No em dashes in any copy on the page
- [ ] No buzzword-list words carrying a sentence that would otherwise be empty
- [ ] Hero is built around a real image, illustration, or specific visual moment, not generic stock photography or an abstract gradient blob
- [ ] The value proposition is clear enough that a first-time visitor knows what this is and who it's for within a few seconds

## Sources consulted

This list was compiled from reporting and technical writing published through mid-2026, including: Y Combinator's "Common Mistakes With Vibe Coded Websites" design review (Aaron Epstein and Raphael Schaad) as covered by Search Engine Journal and Medium; reporting on the Tailwind indigo-500 / purple problem from Medium, DEV Community, and independent blogs; the Impeccable style-linting tool's documented AI-slop rule set; 925 Studios' AI slop design guides; MindStudio's guide to constraining Claude Design output; write-ups on eyebrow text from Socialectric, QC Fixer, and UX Movement; reporting on the em-dash AI-writing tell from The Washington Post, Rolling Stone, and TechCrunch; and a compiled AI buzzword list from useaiwriter.com. Treat this as a snapshot of a fast-moving discourse. Re-search if this file starts to feel stale, since today's distinctive choice is next year's new default.
