# QUVI — Evaluation and Test Plan

## Evaluation objective
Measure how accurately the system extracts supplier quote details, matches them to the purchase request, applies policy, and provides evidence on the supplied sample set.

## Dataset
The brief and sample README describe ten fictional supplier quote/contract PDFs (`supplier-pack-01.pdf` through `supplier-pack-10.pdf`), with each pack corresponding to one PR item. The files currently available in this working package are packs 01 and 02 only. Obtain packs 03–10 before claiming a full ten-document evaluation.

Do not use real company/customer documents.

## Ground truth
Create a manually reviewed, separate ground-truth file before evaluating model output. For each document record:
- Correct supplier identity and tax identifiers.
- Correct quoted item, quantity, unit, unit price, line total.
- Delivery, payment, VAT, validity, and penalty terms.
- Exact evidence text and page.
- Expected decision and all applicable rule findings.
- Any policy ambiguity noted for human interpretation.

Ground truth should not be inferred from the model's prediction. Have a second pass verify the labels where possible.

## Metrics
- **Decision accuracy:** correct final decisions / evaluated documents.
- **Extraction exactness:** exact matches for critical fields (TIN/BIN, quantity, price, dates, payment, VAT, penalty).
- **Hard-rule recall:** fraction of ground-truth hard rejects detected.
- **Review routing recall:** fraction of ambiguous/review cases sent to review.
- **False approval rate:** documents approved despite a reject/review condition.
- **Evidence coverage:** triggered findings with an exact supporting snippet and page reference.
- **Batch resilience:** files completed despite another file failing.
- **Latency:** total and per-document processing time; report sample size and model/provider settings.

For a ten-document set, show counts as well as percentages because one sample changes accuracy by 10 percentage points.

## Test layers
### Unit tests
- Price threshold: exactly max, exactly +3%, just above +3%.
- Advance: 20%, just above 20%.
- Quantity variance: exactly 5%, just above 5%.
- Delivery: 30, 31, 45, 46 days.
- Payment: 30, 60, just outside range, ambiguous wording.
- VAT separately shown at 15%, absent, other rate.
- Validity: 30 days and 29 days.
- TIN/BIN missing individually and together.
- Penalty absent, adequate, below 0.5%/week (policy ambiguity).
- Calculation mismatch.
- Reject + Review findings together (Reject precedence).
- Missing evidence / not-evaluable field.

### Integration tests
- Digital PDF text extraction.
- OCR fallback on scanned/low-text PDF fixture.
- LLM response schema failure and retry behavior.
- Purchase-request matching and unit normalization.
- End-to-end processing of each available sample.
- Batch where one PDF is invalid and others are valid.
- Reprocess with versioned rules without deleting previous results.
- Reviewer decision saved independently of system decision.

### Acceptance checks
- Upload a valid PDF and see a document result.
- Upload several PDFs and see independent statuses.
- Open a finding and view exact evidence/page.
- A hard reject is never approved.
- Uncertain fields route to review.
- Batch continues after a file failure.
- Review actions create an audit record.
- README setup instructions work from a clean environment.

## Results reporting
Do not report expected or hypothetical numbers as actual. Include:
- Dataset count and file names.
- Decision confusion matrix or per-document expected/actual table.
- Critical extraction failures.
- Rule/evidence failures.
- Runtime and settings.
- Known limitations and next steps.
