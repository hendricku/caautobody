# CA Autobody CMS — Phase 3.1 build fix (21 October 2026)

## Reported build failure

`AdminServiceEditor.tsx:99:21` failed TypeScript compilation because a single branch merged `rightImage` into either `OriginalServicePage` or `BrandRepairContent`, breaking the discriminated `ServicePresentation` union. This occurred after Webpack compiled, during Next.js type checking.

## Changes

1. `src/components/Admin/AdminServiceEditor.tsx`: Use separate explicit `editorial` and `brand` branches in `updateRightImage`. Keep `standard` unchanged. The updates preserve the editor's current handlers, `rightImage` data, hero background value, draft/publish flows, and existing page-layout data types.
2. `src/app/admin-design-system.css`: Replace ambiguous `align-items:start` / `align-items:end` with `flex-start` / `flex-end` in the admin stylesheet to address the seven Autoprefixer warnings shown in the uploaded build log. No appearance or layout changes intended.

No public components, database files, API routes, image-processing logic, or admin manual changes.

## Local checks completed

- 167 TS/TSX files: syntax parsing passed.
- 11 CSS files: parsing passed.
- An isolated strict TypeScript regression check using the project's actual `ServicePresentation`, `OriginalServicePage`, and `BrandRepairContent` type declarations: passed.
- Autoprefixer mixed-support warnings for `admin-design-system.css`: zero.
- ZIP integrity and changed-file comparison: verified during package generation.

## Remaining checks in your complete local repo

The supplied source archive lacks `package.json`, lockfile, and installed dependencies, so the complete Next.js production build and ESLint cannot be run against this copy. Apply this patch to the same full repository as your failed build, then run:

```bash
npm run build
```

Run the actual project ESLint command too (`npm run lint`, if defined). Any remaining warnings from the build log (e.g. use of `<img>`, font loading, and React Hook dependencies) are separate from the TypeScript build blocker; most are in public components and intentionally remain unchanged to respect the no-public-website-change requirement. Do not claim a warning-free or fully regression-tested release until the complete build and staging workflows have passed.
