# QUVI — Data Dictionary

This document defines the intended structured extraction and decision fields. Keep source evidence separate from normalized values.

## Conventions
- `string`: UTF-8 text.
- `integer`: whole number.
- `decimal`: fixed-precision numeric value; serialize as a decimal string in JSON where precision matters.
- `date`: ISO 8601 calendar date (`YYYY-MM-DD`) only when the source supports an unambiguous date.
- `boolean`: true/false; use nullable/unknown when evidence is absent or ambiguous.
- `enum`: one of the values listed.
- Missing or unclear source information is `null` plus an evidence/status note, never an inferred value.

## Batch and document lifecycle

| Field | Type | Meaning / validation |
|---|---|---|
| `batch_id` | string | Internal stable identifier for a submitted group of files. |
| `document_id` | string | Internal stable identifier for one quote file. |
| `processing_status` | enum | `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`. |
| `batch_status` | enum | `QUEUED`, `PROCESSING`, `COMPLETED`, `PARTIAL_FAILURE`, `FAILED`. |
| `created_at`, `updated_at` | datetime | ISO 8601 timestamp with timezone. |
| `original_filename` | string | User-supplied name for display only; never use as storage path. |
| `sha256` | string | 64-character lowercase hexadecimal content hash. |
| `error_code` | string/null | Stable machine-readable error code, if processing failed. |
| `error_message` | string/null | Safe, user-facing error message; no stack trace or secret. |

## Supplier and quotation fields

| Field | Type | Meaning / validation |
|---|---|---|
| `supplier_name` | string/null | Supplier name as written in quote. Preserve source spelling. |
| `supplier_tin` | string/null | Supplier Taxpayer Identification Number. Preserve as text; leading zeros may matter. |
| `supplier_bin` | string/null | Supplier Business Identification Number/VAT registration identifier. Preserve as text. |
| `quotation_number` | string/null | Quote/reference number from source. |
| `quotation_date` | date/null | Date printed on quotation, if unambiguous. |
| `valid_until` | date/null | Explicit expiry date; do not calculate if validity basis is unclear. |
| `currency` | string/null | ISO currency code when supported; BDT for this PR context only if quote states or context confirms it. |
| `delivery_days` | integer/null | Promised delivery days relative to PO; basis must be clear. Non-negative. |
| `payment_terms_raw` | string/null | Exact/near-exact source wording. |
| `payment_days_after_delivery` | integer/null | Parsed payment period after delivery; nullable if unclear. |
| `advance_percent` | decimal/null | Advance percentage, 0–100 unless source terms indicate another representation. |
| `vat_rate_percent` | decimal/null | Stated VAT percentage. |
| `vat_separately_shown` | boolean/null | Whether VAT is separately itemized. Unknown if quote is unclear. |
| `late_penalty_rate_per_week_percent` | decimal/null | Late-delivery penalty per week, expressed as percent of order value. |
| `late_penalty_clause_present` | boolean/null | Presence of an explicit late-delivery penalty clause. |

## Line-item fields

| Field | Type | Meaning / validation |
|---|---|---|
| `line_item_id` | string | Stable identifier within extraction/run. |
| `quoted_description` | string | Source description. |
| `quoted_quantity` | decimal/null | Quoted quantity; non-negative. |
| `quoted_unit` | string/null | Source unit; normalize only with an explicit mapping. |
| `quoted_unit_price` | decimal/null | Unit price; non-negative. |
| `line_total` | decimal/null | Stated line total; non-negative. |
| `matched_pr_item_id` | string/null | PR item code matched by the system. |
| `match_status` | enum | `MATCHED`, `AMBIGUOUS`, `UNMATCHED`. |
| `match_confidence` | decimal/null | Do not populate unless the matching method produces a calibrated score; otherwise omit. |
| `price_variance_percent` | decimal/null | `(quoted price - PR max price) / PR max price * 100`. |
| `quantity_variance_percent` | decimal/null | `abs(quoted quantity - PR quantity) / PR quantity * 100`. |

## Evidence and findings

| Field | Type | Meaning / validation |
|---|---|---|
| `evidence_text` | string | Verbatim source excerpt supporting a field or finding. |
| `page_number` | integer/null | One-based PDF page number. |
| `evidence_source` | enum | `PDF_TEXT`, `OCR`, `MANUAL`, `UNKNOWN`. |
| `field_path` | string/null | Structured field path, e.g. `line_items[0].quoted_unit_price`. |
| `rule_id` | string | Stable identifier for a business rule. |
| `rule_version` | string | Version of policy implementation used. |
| `severity` | enum | `REJECT`, `REVIEW`, `INFO`. |
| `finding_status` | enum | `TRIGGERED`, `PASSED`, `NOT_EVALUABLE`. |
| `observed_value` | string/null | Value observed in the quote, serialized without losing precision. |
| `expected_value` | string/null | Policy/PR expectation used for comparison. |

## Decisions and review

| Field | Type | Meaning / validation |
|---|---|---|
| `system_decision` | enum | `APPROVE`, `REJECT`, `NEEDS_HUMAN_REVIEW`; only generated by policy engine. |
| `decision_summary` | string | Concise rationale derived from findings. |
| `reviewer_decision` | enum/null | Human-recorded outcome; define allowed values in API model and keep separate from system decision. |
| `reviewer_note` | string/null | Human note. |
| `reviewed_at` | datetime/null | Timestamp for the review event. |
| `pipeline_version` | string | Version of extraction/processing pipeline. |

## PR-2026-114 reference values
| Item | Description | Unit | Quantity | Maximum unit price (BDT) |
|---|---|---|---:|---:|
| A | Cotton twill fabric, 280 gsm | metre | 12000 | 480.00 |
| B | Metal zipper, 18 cm | piece | 20000 | 38.00 |
| C | Polyester sewing thread, cone | cone | 800 | 210.00 |
| D | Poly bag, 30 x 40 cm | piece | 50000 | 6.50 |
| E | Carton box, 5-ply | piece | 3000 | 95.00 |
