# QUVI — Architecture Decision Log

This log records the currently proposed decisions. Update it when a decision is changed, including the reason and impact.

## ADR-001 — Modular monolith
**Status:** Accepted for prototype  
**Decision:** Use one FastAPI backend organized into modules, plus a Next.js frontend.  
**Context:** The task has a short implementation window. Distributed services would add setup and operational complexity.  
**Consequences:** Simple local execution and easier end-to-end debugging; module boundaries must be maintained to avoid a monolith becoming tangled.

## ADR-002 — LLM extracts; deterministic code decides
**Status:** Accepted  
**Decision:** Use the LLM to parse variable quote wording into structured fields. Apply policy thresholds in Python.  
**Context:** Business decisions must be repeatable and testable.  
**Consequences:** Rule outcomes are deterministic for a given normalized input and rule version; extraction can still be uncertain and must be reviewed.

## ADR-003 — OCR as fallback
**Status:** Accepted  
**Decision:** Extract embedded PDF text first and use OCR on low-text/scanned pages.  
**Context:** Digital text is usually more direct, while OCR introduces recognition errors and cost.  
**Consequences:** The extraction layer must retain page provenance and handle mixed text/OCR pages.

## ADR-004 — Shared per-document pipeline for batch and single uploads
**Status:** Accepted  
**Decision:** A batch schedules independent document jobs that invoke the same processing function.  
**Context:** Avoid behavior drift between single and batch processing.  
**Consequences:** Each file needs isolated status/error handling; batch aggregates are derived from individual outcomes.

## ADR-005 — Preserve system and human decisions separately
**Status:** Accepted  
**Decision:** Store the original system decision and append reviewer outcomes separately.  
**Context:** Review should not erase model/policy history.  
**Consequences:** The UI can display system recommendation, reviewer decision, and review notes distinctly.

## ADR-006 — SQLite and local file storage for initial demo
**Status:** Accepted for prototype  
**Decision:** Use SQLite for metadata and local storage for PDFs.  
**Context:** Minimize setup and support a self-contained local demo.  
**Consequences:** This is not a production scaling/security architecture; production would need access controls, retention, durable job handling, and operational backups.

## ADR-007 — Sequential batch processing initially
**Status:** Accepted for prototype  
**Decision:** Process files sequentially before considering bounded concurrency.  
**Context:** Simplify reliability and avoid provider throttling or SQLite write contention during the initial build.  
**Consequences:** Large batches take longer; concurrency can be added after measurement.

## ADR-008 — Conservative interpretation of penalty below policy minimum
**Status:** Proposed / policy clarification needed  
**Decision:** If a penalty clause exists but is below 0.5% of order value per week, route to human review.  
**Context:** The supplied policy states a minimum but does not clearly assign Reject versus Review to this specific case.  
**Consequences:** Avoid silently inventing a hard rejection. Confirm with task owner if possible.

## ADR-009 — Evaluation limited to files actually available
**Status:** Accepted  
**Decision:** Do not claim a ten-pack evaluation until all ten packs are present and processed.  
**Context:** The brief references ten supplier packs, but only packs 01 and 02 were available at documentation preparation time.  
**Consequences:** Report current dataset size and limitations accurately.

## ADR-010 — Normalize week-based delivery terms to exact days
**Status:** Accepted  
**Decision:** Convert delivery terms stated in weeks to days using the exact factor 1 week = 7 days (for example, 4 weeks = 28 days) before applying policy thresholds.  
**Context:** Pack 09 states "Delivery within 4 weeks of PO." The policy thresholds are expressed in days (30 days preferred, 31–45 review, more than 45 reject). Treating an exact week-to-day conversion as unclear produced a spurious review finding: 4 weeks is 28 days, below the 31-day review band.  
**Consequences:** Week-based terms are evaluated deterministically. Non-exact or vague terms (for example, "delivery as agreed" or a range) still route to `DELIVERY_DAYS_UNCLEAR_REVIEW`. Pack 09 is now reviewed for its payment range and line-total mismatch only.

## ADR-011 — Treat pack 05's duplicated advance wording as redundant, not contradictory
**Status:** Accepted  
**Decision:** Interpret pack 05's payment clause as a clearly stated 40% advance and reject under `ADVANCE_PAYMENT_ABOVE_LIMIT_REJECT`.  
**Context:** The clause reads "40% advance payable with the purchase order. 40% advance with the purchase order, balance 60% within 30 days of delivery." The duplication is untidy, but both statements name the same advance percentage and the balance completes a 100% schedule.  
**Consequences:** The deterministic extraction reads 40%, which exceeds the 20% limit. A stricter reading — duplicated wording is ambiguous enough to send to human review — is defensible but was not chosen because no value conflicts. This is recorded as a judgment call in the evaluation report and is a suitable Loom discussion point.

## ADR-012 — Evaluation ground truth is a regression baseline, not independent validation
**Status:** Accepted  
**Decision:** Label `docs/evaluation/ground-truth.json` honestly as authored by the QUVI implementer (AI coding assistant), not as an independent assessment.  
**Context:** The same AI coding assistant implemented the extraction/rule engine and wrote the expected decisions afterwards. The expectations were derived from the policy, purchase-request CSV, and PDF text rather than copied from engine output, but they are not an independent human review.  
**Consequences:** A 10/10 result demonstrates internal consistency and guards against regressions. It does not prove correctness. Independent validation requires a person who has not seen the implementation to re-derive the expected decisions.


## ADR-013 — Separate unreadable fields from confirmed absence
**Status:** Accepted
**Decision:** Add `NOT_LOCATED` to `ExtractionStatus`. A reject fires only on EXTRACTED values that break a limit, or on `MISSING` fields carrying absence evidence. `NOT_LOCATED` and `UNCLEAR` findings are `REVIEW`, titled `Could not read [field] from this quotation`.
**Context:** The brief says to stop and ask a person when unsure. Treating every unclear field as a reject was unsafe, especially for unfamiliar layouts.
**Consequences:** TIN/BIN reject needs a readable keyword with no value, or confirmed absence from an otherwise readable header. Ambiguous evidence routes to review. Pack 08 remains a reject because no TIN/BIN keyword/value is present in a readable document.
**Deviations:** Only TIN, BIN, and late penalty use exact "Could not read" title; thresholds and rule text unchanged; keyword absence is treated as confirmed absence only when the header is otherwise readable.

## ADR-014 — Mobile navigation is the same sidebar in a drawer
**Status:** Accepted
**Decision:** Keep one sidebar component for both desktop and mobile. Desktop renders it as the existing `258px` rail. Below `lg`, a header menu button opens the same navigation content in a `280px` drawer with an overlay, Escape-to-close, focus return, and background scroll lock.
**Context:** The desktop design is the reference. Duplicating a separate mobile navigation would drift from it and risk removing navigation items or active states.
**Consequences:** Navigation items, icons, active styles, and the account block stay identical across sizes. The app shell now owns scrolling (`h-screen` with an inner scroll column) so the drawer can lock the scroll host without touching `body`.

## ADR-015 — Root URL is a welcome page; the dashboard lives at `/dashboard`
**Status:** Accepted
**Decision:** Serve a static welcome page at `/` and move the existing dashboard to `/dashboard`. Nothing else about the dashboard changes, and every sidebar/back link points at `/dashboard`.
**Context:** The requested entry screen should explain QUVI before the working interface, without adding auth or onboarding.
**Consequences:** `/` is outside the `(dashboard)` route group, so it renders without the sidebar. All existing application routes remain directly reachable and there is no redirect. The dashboard route is unchanged in content and was verified pixel-identical at `1280px` and `1440px`.

## ADR-016 — Welcome hero shows the real dashboard as a scaled preview; the app opens dark
**Status:** Accepted
**Decision:** The welcome page renders the real dashboard composition (sidebar, overview hero, summary cards, recent quotations, needs attention) from a dedicated `/dashboard/preview` route, embedded in the hero inside a scaled iframe frame. The preview uses fictional sample data (`frontend/lib/preview-data.ts`) built from the real API types with neutral supplier names and quotation IDs, and no visible "demo" labels. Dark is the default theme (`defaultTheme="dark"` via next-themes, `color-scheme: dark`), and `OverviewHero` gained `dark:` variants so it no longer renders as a light panel in dark mode.
**Context:** The hero should present the actual product rather than a static illustration, stay visually consistent in dark mode, and avoid fabricating real-looking supplier facts. The preview route lives outside the `(dashboard)` group so it renders without the dashboard shell and never calls the backend; the working dashboard at `/dashboard` and all data flows are unchanged.
**Consequences:** Landing-page sample data can drift from real backend behaviour by design and is confined to `preview-data.ts` (internal `preview-*` identifiers make the source traceable). Users with an explicit stored light preference still get light mode. The hero background uses layered, heavily blurred low-alpha radial gradients (no spotlight), and the preview is cropped at the fold like the reference composition.
