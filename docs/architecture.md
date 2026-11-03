# QUVI — Technical Architecture

## Architecture choice
Use a **modular monolith** with a web UI and a Python API. This keeps the 72-hour project understandable and runnable while preserving clear boundaries between extraction, validation, policy evaluation, evidence, and review.

### Stack
- **Frontend:** Next.js, TypeScript, Tailwind CSS, shadcn/ui.
- **Backend:** Python, FastAPI, Pydantic.
- **PDF text:** PyMuPDF (fitz).
- **OCR fallback:** Tesseract through an OCR adapter (only when text extraction is insufficient).
- **LLM extraction:** provider/model behind a small adapter; structured output validated with Pydantic.
- **Persistence:** SQLite for local demo metadata and decisions.
- **Files:** local filesystem storage, with generated opaque IDs and safe filenames.
- **Tests:** pytest; deterministic policy tests and a sample-document evaluation harness.

> The model provider and deployment target are configuration decisions. Keep secrets out of source control and never send real company/customer data in this challenge.

## High-level components

```text
Browser / Next.js UI
  ├─ Batch upload + progress
  ├─ Document results + evidence
  └─ Human review panel
          │ HTTP / JSON
          ▼
FastAPI application
  ├─ Batch & document API
  ├─ Processing orchestrator
  │    1. file intake / safety checks
  │    2. PDF text extraction
  │    3. OCR fallback if needed
  │    4. structured LLM extraction
  │    5. schema + field validation
  │    6. purchase request matching
  │    7. deterministic policy engine
  │    8. evidence assembly
  │    9. persist result
  ├─ Human review service
  └─ Evaluation runner
       │
       ├─ SQLite metadata / results
       └─ Local document storage
```

## Fixed pipeline and responsibility boundaries
1. **Intake:** validate extension, MIME/type signature, size, and page count; assign an internal ID; store file safely.
2. **Text extraction:** extract page-level text. Record page numbers and extraction quality signals.
3. **OCR fallback:** invoke OCR for pages with insufficient text. Retain page boundaries and OCR provenance.
4. **LLM extraction:** request only schema-defined fields. Include source text/page references where possible. The model must not make a policy decision.
5. **Schema validation:** parse into typed Pydantic models. Missing or malformed required values are represented as missing/invalid, not invented.
6. **Normalization:** normalize dates, currencies, units, percentages, and supplier identifiers without changing source evidence.
7. **Purchase request matching:** match the quote's line item to PR-2026-114 using item identity/description and units. Uncertain matches are flagged.
8. **Rule evaluation:** apply the versioned rules in Python. Preserve every triggered finding.
9. **Evidence assembly:** attach exact source snippets, page numbers, field path, and extraction source.
10. **Persistence:** save extracted data, findings, system decision, processing state, and review history.

## Decision engine
- **Reject** when at least one confirmed reject rule applies.
- Otherwise, **Needs a person to check** when a review rule applies, evidence is ambiguous, a required value is missing, or a check cannot be evaluated safely.
- **Approve** only when all applicable rules are evaluated and none trigger.
- Preserve all findings even when Reject takes precedence over review.
- Do not collapse processing failure into a business decision. A failed document has a processing error state and no fabricated decision.

## Data flow
The uploaded file is immutable after intake. Extracted structured data and decisions are derived artifacts and should include pipeline/rule versions. A reviewer action creates a separate review record; it does not overwrite the system's original result.

## Persistence model
SQLite tables (or equivalent entities):
- `batches`
- `documents`
- `extractions`
- `findings`
- `decisions`
- `reviews`
- `purchase_requests`
- `purchase_request_items`

Store source file path and SHA-256 hash. Store raw extraction output only if useful for debugging and avoid retaining unnecessary prompt/context data. Use transaction boundaries for result persistence.

## Error handling
- File-level errors are isolated; batch processing continues.
- Retry only transient extraction/model errors with bounded attempts.
- A permanent parse/extraction failure is marked failed or review-required according to whether a meaningful result exists.
- API errors return structured messages and stable error codes.
- Do not expose stack traces, model keys, or internal file paths in the UI.

## Security and privacy basics
- Use fictional task files only.
- Restrict accepted file types and size/page count.
- Generate storage names rather than trusting uploaded filenames.
- Keep provider keys in environment variables.
- Avoid logging full supplier documents or sensitive extracted values.
- For production: authentication, authorization, malware scanning, retention controls, audit logging, and encrypted storage are required.

## Architecture decision records
### ADR-001: Modular monolith
Chosen for the short task timeline and easy local setup. Separate modules provide testable boundaries without distributed-service overhead.

### ADR-002: LLM extraction, deterministic decisions
The LLM handles variable document wording. Python rules handle policy and thresholds so the outcome is repeatable and testable.

### ADR-003: OCR only as fallback
Digital PDF text extraction is faster and typically preserves text accurately. OCR is invoked only when text extraction is weak or absent.

### ADR-004: System and human decisions remain separate
This preserves auditability and makes reviewer overrides visible rather than erasing the original system output.
