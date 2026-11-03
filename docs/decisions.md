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
