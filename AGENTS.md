# QUVI — AI Coding Assistant Instructions

## Project mission
Build QUVI, an explainable supplier quotation checker for the fictional Aamar Garments Ltd. It reads supplier quote PDFs, extracts structured data, compares quotes with a purchase request, applies deterministic company rules, and routes uncertain cases to human review.

## Source of truth
Before changing behavior, read these documents in order:
1. `docs/project-overview.md`
2. `docs/architecture.md`
3. `docs/implementation-spec.md`
4. `docs/business-rules.md`
5. `docs/batch-workflow.md`
6. `docs/api-and-data-model.md`
7. `docs/data-dictionary.md`
8. `docs/prompt-design.md`
9. `docs/decisions.md`

If source files or the challenge brief disagree with this documentation, call out the conflict and ask for clarification rather than silently choosing a new policy.

## Architecture boundaries
- Keep the first version a modular monolith.
- Keep the workflow fixed and sequential: intake → PDF text extraction → OCR fallback → structured extraction → validation/normalization → PR matching → deterministic rules → evidence assembly → persistence.
- The LLM extracts fields; it must not make the final policy decision.
- Business rules and thresholds belong in deterministic Python code, not prompts.
- Both single-file and batch uploads must use the same per-document pipeline.
- A failed document must not stop other documents in its batch.
- Preserve system decisions separately from human review decisions.
- Preserve source evidence, rule version, and pipeline version for traceability.
- Do not invent fields, policy thresholds, supplier facts, evaluation results, or evidence.

## Implementation conventions
- Use Python + FastAPI + Pydantic for backend services.
- Use Next.js + TypeScript + Tailwind + shadcn/ui for the frontend.
- Use PyMuPDF for digital PDF text extraction and Tesseract via an OCR adapter when needed.
- Use SQLite for the initial local prototype; keep persistence behind clear modules.
- Use `Decimal` (or a fixed-precision database type) for money and threshold calculations. Avoid binary floating-point for currency comparisons.
- Keep API schemas explicit and validated.
- Use stable IDs, safe generated storage names, and SHA-256 file hashes.
- Keep provider integrations behind adapters and configure secrets via environment variables.
- Prefer small, typed, testable functions. Avoid unnecessary abstraction or agent frameworks.

## Safety and uncertainty
- Missing, conflicting, ambiguous, or unsupported critical values must not be guessed.
- Route uncertainty to `NEEDS_HUMAN_REVIEW` unless processing itself failed.
- A processing failure is not a business decision.
- Require source snippets and page references for findings whenever available.
- Never show fabricated confidence percentages. If confidence is not calibrated, use qualitative status.
- Do not log full PDF text, credentials, or secrets by default.

## Tests
Add or update tests for every behavior change. Include policy-boundary tests and batch isolation tests.
Run the relevant tests and report the exact command and outcome. Never claim tests passed unless they were actually run.

## Commands
Use the implemented setup paths:
- Backend tests: `cd quvi/backend && .venv/bin/pytest` (after backend tests are added)
- Backend development server: `cd quvi/backend && source .venv/bin/activate && uvicorn main:app --reload --host 127.0.0.1 --port 8000`
- Frontend development server: `cd quvi && npm run dev`

The documented backend entrypoint is `quvi/backend/main.py`. Replace commands when packaging scripts change.

## Avoid
- Do not add real supplier/customer data.
- Do not add autonomous purchasing, PO issuance, supplier contact, or contract signing.
- Do not overwrite prior processing runs or reviewer decisions during reprocessing.
- Do not introduce a queue service or distributed architecture unless explicitly approved.
- Do not change the policy interpretation without updating `docs/business-rules.md`, tests, and `docs/decisions.md`.
