# QUVI — Batch Workflow

## Design
Batch upload is a convenience layer over the exact same per-document workflow used for a single upload. The batch is not a shared decision context: each supplier quote is evaluated independently against the purchase request and rules.

## Workflow
```text
User selects multiple PDFs
        ↓
Validate each file (PDF signature, size, page count)
        ↓
Create batch record + document records
        ↓
Queue accepted files
        ↓
For each document, sequentially:
  1. Extract PDF text by page
  2. OCR low-text pages if needed
  3. Extract structured quote fields with LLM
  4. Validate/normalize fields
  5. Match quote item to purchase request
  6. Evaluate deterministic policy rules
  7. Build exact evidence and findings
  8. Persist decision + processing outcome
        ↓
Update batch aggregate status/counts
        ↓
Show results, errors, and review queue
```

## Isolation and resilience
- Each document has its own processing boundary and error record.
- A bad file, OCR failure, model timeout, or invalid model response must not cancel other documents.
- Retry transient failures a bounded number of times; do not retry deterministic validation errors indefinitely.
- Sequential processing is acceptable for the first version. Add bounded concurrency only after testing provider limits and SQLite behavior.
- Keep a batch-level correlation ID and per-document IDs in logs.

## Status model
### Document
`QUEUED` → `PROCESSING` → `COMPLETED` or `FAILED`

Business decision is independent:
`APPROVE`, `REJECT`, or `NEEDS_HUMAN_REVIEW`.

### Batch
- `QUEUED`: no file has started.
- `PROCESSING`: at least one file is processing.
- `COMPLETED`: all files terminal and at least one completed, with no failures.
- `PARTIAL_FAILURE`: all files terminal and there are both successful and failed documents.
- `FAILED`: all documents failed.

A batch can complete while containing documents that need human review. Review is a decision outcome, not a processing failure.

## User interface
Show:
- Batch name/ID and created time.
- Total files, queued, processing, completed, failed.
- Counts of Approve / Reject / Needs human review.
- Per-file filename, supplier (when known), processing status, decision, finding count.
- Safe error explanation and retry/reprocess action.
- Link to the detailed evidence view.

## Idempotency and duplicate handling
- Use a content hash (SHA-256) to identify exact duplicate uploads within a batch.
- Decide and document whether duplicates are skipped, linked, or processed again. Recommended demo behavior: warn and avoid duplicate work within the same batch; allow intentional reprocessing as a separate run.
- Do not assume identical file hashes imply identical business records across all contexts.

## Operational note
For the initial local demo, a lightweight sequential worker invoked by FastAPI is sufficient. A durable production queue (for example Redis + a task worker) is a future improvement, not a requirement for the prototype.
