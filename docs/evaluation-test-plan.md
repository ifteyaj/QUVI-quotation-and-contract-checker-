# QUVI — Evaluation and Test Plan

## Evaluation objective
Measure how accurately the system extracts supplier quote details, matches them to the purchase request, applies policy, and provides evidence on the supplied sample set.

## Dataset
The brief and sample README describe ten fictional supplier quote/contract PDFs (`supplier-pack-01.pdf` through `supplier-pack-10.pdf`), with each pack corresponding to one PR item. All ten files are present in `docs/assessment/`.

Supplier mapping: 01 Padma Textile Mills, 02 Jamuna Trims and Accessories, 03 Karnaphuli Yarn Traders, 04 Surma Packaging Industries, 05 Meghna Carton Works, 06 Teesta Fabrics Ltd, 07 Rupsha Zipper Factory, 08 Bhairab Thread and Co, 09 Dhaleshwari Poly Pack, 10 Kushiyara Box Industries.

Do not use real company/customer documents.

## Ground truth
`docs/evaluation/ground-truth.json` records, for each document:
- Correct supplier identity and tax identifiers.
- Correct quoted item, quantity, unit, unit price, line total.
- Delivery, payment, VAT, validity, and penalty terms.
- Exact evidence text and page.
- Expected decision and all applicable rule findings.
- Any policy ambiguity noted for human interpretation.

**Independence:** the file was authored by the QUVI implementer (AI coding assistant) after the rule engine existed. It was derived from the policy, purchase request, and PDF text rather than copied from engine output, but it is not an independent human assessment. Treat it as a regression baseline. Independent validation requires a person who has not seen the implementation to re-derive the expected decisions.

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
