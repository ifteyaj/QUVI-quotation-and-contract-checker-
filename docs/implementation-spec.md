# QUVI — Implementation Specification

## Product behavior
The app supports a single PDF upload and multi-file batch upload. Both routes call the same document processing pipeline. Each document receives an independent result.

### Main screens
1. **Dashboard:** batches, totals, decision counts, processing status.
2. **New batch:** drag/drop PDFs, show file list and validation errors, start processing.
3. **Batch detail:** per-document status, decision, supplier, findings count, and open-result action.
4. **Document detail:** extracted fields, PR comparison, policy checks, evidence excerpts, and decision.
5. **Human review:** reviewer decision, notes, unresolved issues, and review history.

### Decision labels
- `APPROVE` — all applicable checks passed.
- `REJECT` — at least one confirmed hard-reject rule triggered.
- `NEEDS_HUMAN_REVIEW` — any review trigger, uncertainty, missing required evidence, or non-evaluable check exists without a confirmed reject.
- Processing state is separate: `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`.

### Document record
Minimum fields:
- `id`, `batch_id`, `original_filename`, `stored_path`, `sha256`
- `processing_status`, `created_at`, `updated_at`
- `supplier_name`, `supplier_tin`, `supplier_bin`
- `quotation_number`, `quotation_date`, `valid_until`
- `currency`, `delivery_days`, `payment_terms`
- `vat_rate`, `vat_separately_shown`
- `late_penalty_rate_per_week`
- `line_items[]`
- `system_decision`, `decision_summary`
- `review_status`, `reviewer_decision`, `reviewer_note`

### Line item fields
- `quoted_description`, `quoted_quantity`, `quoted_unit`
- `quoted_unit_price`, `line_total`
- `matched_pr_item_id`, `match_confidence`
- `quantity_variance_pct`, `price_variance_pct`
- `evidence[]`

### Finding fields
- `rule_id`, `rule_version`, `severity` (`REJECT`, `REVIEW`, `INFO`)
- `title`, `message`
- `field_path`, `observed_value`, `expected_value`
- `evidence_text`, `page_number`, `evidence_start/end` (if available)
- `status` (`TRIGGERED`, `PASSED`, `NOT_EVALUABLE`)

## API outline
All endpoints return JSON. Exact response schemas should be defined in Pydantic.

### Batch
- `POST /api/batches` — create batch from uploaded files; returns batch and document IDs.
- `GET /api/batches` — list recent batches.
- `GET /api/batches/{batch_id}` — batch progress and aggregate counts.
- `POST /api/batches/{batch_id}/process` — start processing if not already active.

### Documents
- `GET /api/documents/{document_id}` — document summary and result.
- `GET /api/documents/{document_id}/evidence` — findings and source evidence.
- `POST /api/documents/{document_id}/reprocess` — re-run pipeline with explicit version/config.

### Review
- `POST /api/documents/{document_id}/review` — record human outcome and note.
- `GET /api/documents/{document_id}/reviews` — review history.

### Purchase requests
- `GET /api/purchase-requests/{pr_number}` — request and item list.
- `POST /api/purchase-requests` — import/replace a request for demo use.

## Request/response expectations
- Validate uploads before accepting them.
- Return a batch ID and per-file document IDs.
- Return processing state rather than keeping a long upload request open for the entire pipeline.
- UI polls batch/document status at a modest interval during processing.
- Review endpoint requires reviewer decision and can accept a note.
- Reprocessing must not erase prior decisions/reviews; create a new run/version or retain history.

## Batch processing behavior
- A batch is a container, not a single all-or-nothing transaction.
- Each file runs through the shared pipeline independently.
- A failure in one file does not prevent other files from completing.
- Batch status is derived:
  - `QUEUED` if none have started.
  - `PROCESSING` if one or more are in progress.
  - `COMPLETED` when all documents are terminal and at least one completed.
  - `FAILED` when all documents failed.
  - `PARTIAL_FAILURE` when terminal documents include both successful and failed.
- Store per-file error code and user-safe message.
- Initial version may process sequentially to reduce complexity and provider load.

## Validation requirements
- Reject non-PDF files or files whose signature does not match a PDF.
- Enforce configurable size and page-count limits.
- Detect empty or low-text PDFs and try OCR.
- Ensure extracted numbers are finite and non-negative where applicable.
- Do not coerce ambiguous units/currency or ambiguous date interpretations.
- Require evidence for key fields and rule findings.
- If extraction confidence is not supported/calibrated, do not present it as a probability; use qualitative flags.

## Non-functional requirements
- Reproducible local setup.
- Deterministic policy engine.
- Clear logs with correlation IDs, no document text by default.
- Graceful file-level failure.
- Keyboard-accessible UI and clear status labels.
- Testable modules and documented environment variables.
