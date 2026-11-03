# QUVI — API and Data Model

## API convention
Prefix endpoints with `/api`. Use JSON for request/response bodies and multipart form data for file uploads. Return stable error codes and avoid leaking stack traces.

## Endpoint inventory
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/batches` | Create batch and upload documents |
| GET | `/api/batches` | List recent batches |
| GET | `/api/batches/{batch_id}` | Batch progress and result counts |
| POST | `/api/batches/{batch_id}/process` | Start or resume eligible processing |
| GET | `/api/documents/{document_id}` | Document result and decision |
| GET | `/api/documents/{document_id}/evidence` | Findings/evidence snippets |
| POST | `/api/documents/{document_id}/reprocess` | Create a new processing run |
| POST | `/api/documents/{document_id}/review` | Record human review outcome |
| GET | `/api/documents/{document_id}/reviews` | Review history |
| GET | `/api/purchase-requests/{pr_number}` | Read PR and items |
| POST | `/api/purchase-requests` | Import PR data for demo |

## Conceptual entities
### Batch
- `id`
- `created_at`
- `status`
- `document_count`
- aggregate counts by processing status and decision

### Document
- `id`, `batch_id`
- `original_filename`, `stored_path`, `sha256`
- `processing_status`, `error_code`, `error_message`
- timestamps

### ProcessingRun
- `id`, `document_id`, `pipeline_version`, `rule_version`
- `started_at`, `completed_at`, `status`
- extraction and normalization metadata

### Extraction
- `run_id`
- supplier, quotation metadata, tax IDs
- delivery, payment, VAT, validity, penalty fields
- line items and source evidence

### Finding
- `id`, `run_id`, `rule_id`, `severity`, `status`
- `field_path`, `observed_value`, `expected_value`
- `message`, `evidence_text`, `page_number`

### Decision
- `run_id`, `system_decision`, `summary`
- decision timestamp and rule version

### Review
- `id`, `document_id`, `reviewer_decision`, `reviewer_note`
- `reviewer_id` (optional in prototype)
- `created_at`
- reference to the system run being reviewed

### PurchaseRequest / PurchaseRequestItem
- PR number and metadata.
- Item code, description, unit, requested quantity, maximum unit price (BDT).

## Example decision response (illustrative)
```json
{
  "document_id": "doc_example",
  "processing_status": "COMPLETED",
  "system_decision": "NEEDS_HUMAN_REVIEW",
  "findings": [
    {
      "rule_id": "PRICE_WITHIN_REVIEW_BAND",
      "severity": "REVIEW",
      "status": "TRIGGERED",
      "observed_value": "490.00 BDT",
      "expected_value": "≤ 480.00 BDT (review band up to +3%)",
      "evidence_text": "Unit price: BDT 490.00",
      "page_number": 1
    }
  ]
}
```
This is a schema illustration only, not a result from a supplied sample.

## Data integrity
- Use foreign keys and transactions.
- Keep a run/version relationship so reprocessing does not overwrite prior outputs.
- Store monetary values as decimal strings or fixed-precision numeric types, not binary floats.
- Keep source evidence immutable and reviewer actions append-only.
