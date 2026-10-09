---
name: plan-before-code
description: Use this skill before touching any code when the user wants a careful investigation and written implementation plan for a feature change, bug fix, or status/label/UI logic update — especially in booking, scheduling, appointment, or other stateful systems (e.g. waitlist statuses, appointment statuses, order states). Trigger on phrases like "don't start coding yet", "investigate first", "create an implementation plan", "before you implement", "plan then wait for my go-ahead", or any request to review current behavior, flag risks, and propose a safe approach before writing code. Also trigger when the user asks for a plan covering UI/UX, accessibility, security, and regression risk together for a change to existing labels, colors, confirmation messages, or state logic — this combination is a strong signal they want this structured plan-first workflow rather than an immediate code change. Do not use this for quick one-off fixes the user explicitly wants done immediately.
---

# Plan Before Code

A two-phase workflow for changing status-driven or label-driven UI/logic in an existing app: **investigate and plan first, get explicit approval, then implement with tests.** This exists because changes to status/label systems (waitlist, appointment, order, booking states) are deceptively risky — a "just change the label" request often hides incorrect status logic, race conditions, or accessibility gaps that only surface in production.

Never skip straight to editing code when this skill triggers, even if the fix looks small. The whole point is surfacing what a quick fix would miss.

## Phase 1: Investigate and write the plan

Do not modify any files yet. Do not run build, dev, install, migration, deploy, or destructive git commands during this phase — read-only investigation only.

Explore the actual codebase (don't guess) to answer each of these for the specific feature the user named:

1. **Where things live today** — which files/components implement the current labels, colors, confirmation messages, and status logic. Cite actual file paths and line ranges, not assumptions.
2. **Blast radius** — which frontend components, backend endpoints, database fields/columns, validation rules, and notification flows (email/SMS/push) touch this state.
3. **Visual vs. logical bug** — determine whether the issue is purely a display/labeling problem, or whether the underlying status logic itself produces an incorrect state (e.g. something shows "confirmed" but the record's actual status is wrong). This distinction changes the whole scope of the fix, so verify it directly in the code/data rather than assuming.
4. **Safest implementation path** — the option least likely to break existing records or in-flight bookings/appointments. Prefer additive/backward-compatible changes over ones that require data migration or reinterpret existing rows.
5. **Desktop and mobile behavior** — how the UI should respond at each breakpoint if that differs.
6. **Status differentiation** — for every relevant status (e.g. waitlisted, available, pending, confirmed, cancelled, fully booked — substitute the actual status set for this app), specify how it's differentiated both visually (color/label/icon) and logically (what conditions produce it), and confirm no two statuses collapse into the same visual treatment.
7. **Accessibility** — contrast ratios, label clarity, keyboard navigation, screen-reader text, and confirming status is never conveyed by color alone.
8. **Security and data integrity** — authorization checks, sensitive data exposure, race conditions (e.g. two users claiming the last slot simultaneously), duplicate-entry prevention, and capacity/limit enforcement. Assume frontend validation can't be trusted; state where server-side checks must live.
9. **Edge cases and regression risk** — what existing flows could break, including boundary conditions (last slot, zero slots, simultaneous requests, already-cancelled records).
10. **Assumptions to verify** — anything you couldn't confirm from the code alone (business rules, intended behavior, data ownership) — list these explicitly and ask rather than guessing silently.

Apply current clean-code, security, UI/UX, and accessibility best practices. Avoid generic, over-decorated "AI slop" UI — no gradients, excessive cards, decorative animation, or icons that don't help the user understand the status; the goal is clarity, not visual flourish. Reuse existing components and design tokens rather than introducing new ones. Keep UI presentation separated from business logic, avoid duplicated logic, and don't introduce new dependencies unless there's a clear need. Preserve existing coding conventions unless there's a strong reason to deviate — note the reason if you do.

**Before presenting the plan, self-critique it.** Reread it as if you were a skeptical senior engineer: where could this fail under real usage? What race condition did you wave away? What user flow is still confusing? Revise the plan based on that critique before showing it to the user.

Present the plan in the conversation (not as a code change) and explicitly ask the user to review it and give the go-ahead before any code is written. Do not write or edit code in this phase, even trivial code, unless the user says otherwise.

## Phase 2: Implement (only after explicit approval)

Wait for the user's explicit instruction to proceed. Don't infer approval from silence or from the user asking a clarifying question about the plan.

Once approved, implement the plan as written (flag it if you need to deviate). Then write automated tests covering:

- Unit tests for the core status/state logic
- Component/UI tests for labels, colors, and confirmation messages
- Integration tests for the primary user flow being changed (e.g. joining a waitlist, booking a slot)
- Tests for duplicate-entry prevention
- Tests for boundary conditions (e.g. fully booked, newly available slot)
- Tests for concurrent/simultaneous requests and race conditions
- Authorization and security tests
- Regression tests for the normal (unchanged) flow
- Load/stress tests for high-concurrency scenarios where relevant
- Mobile and accessibility checks

Don't run `npm run build` (or equivalent) unless the user explicitly asks for it — running tests doesn't require a full build.

## Adapting this to the actual project

The status set, tech stack, and file layout will vary per project — substitute the real statuses, real component names, and real endpoints for the ones in this template rather than treating "waitlisted/confirmed/cancelled" as fixed. The structure (investigate → plan → self-critique → approval gate → implement → test) is what matters, not the specific example.