# QUVI assessment evaluation report

- Generated: 2026-11-04T06:20:56.284636+00:00
- Evaluation version: 1.0.0
- Rule version: aamar-garments-rules-v1
- Source revision: ad68e55
- Ground truth: `/Users/ifteyajahmed/Desktop/BIAI-AI-Engineer-Round2-Pack/QUVI/QUVI-quotation-and-contract-checker-/docs/evaluation/ground-truth.json`
- Assessment directory: `/Users/ifteyajahmed/Desktop/BIAI-AI-Engineer-Round2-Pack/QUVI/QUVI-quotation-and-contract-checker-/docs/assessment`

## Summary

- Documents evaluated: 10
- Decision accuracy: 10/10 (100.0%)
- Exact rule ID set matches: 10/10
- False approvals: 0
- False rejections: 0
- Unnecessary human reviews: 0
- Missed human reviews: 0
- Correct human-review decisions: 3

## Per-document results

| Document | Expected decision | Actual decision | Correct | Expected rule IDs | Actual rule IDs |
|---|---|---|---:|---|---|
| supplier-pack-01.pdf | APPROVE | APPROVE | Yes | none | none |
| supplier-pack-02.pdf | APPROVE | APPROVE | Yes | none | none |
| supplier-pack-03.pdf | REJECT | REJECT | Yes | PRICE_ABOVE_3_PERCENT_REJECT | PRICE_ABOVE_3_PERCENT_REJECT |
| supplier-pack-04.pdf | NEEDS_HUMAN_REVIEW | NEEDS_HUMAN_REVIEW | Yes | PRICE_ABOVE_MAX_REVIEW_BAND | PRICE_ABOVE_MAX_REVIEW_BAND |
| supplier-pack-05.pdf | REJECT | REJECT | Yes | ADVANCE_PAYMENT_ABOVE_LIMIT_REJECT | ADVANCE_PAYMENT_ABOVE_LIMIT_REJECT |
| supplier-pack-06.pdf | REJECT | REJECT | Yes | LATE_PENALTY_MISSING_REJECT | LATE_PENALTY_MISSING_REJECT |
| supplier-pack-07.pdf | NEEDS_HUMAN_REVIEW | NEEDS_HUMAN_REVIEW | Yes | QUANTITY_VARIANCE_GREATER_THAN_5_REVIEW | QUANTITY_VARIANCE_GREATER_THAN_5_REVIEW |
| supplier-pack-08.pdf | REJECT | REJECT | Yes | SUPPLIER_BIN_MISSING_REJECT, SUPPLIER_TIN_MISSING_REJECT | SUPPLIER_BIN_MISSING_REJECT, SUPPLIER_TIN_MISSING_REJECT |
| supplier-pack-09.pdf | NEEDS_HUMAN_REVIEW | NEEDS_HUMAN_REVIEW | Yes | DELIVERY_DAYS_UNCLEAR_REVIEW, LINE_TOTAL_MISMATCH_REVIEW, PAYMENT_DAYS_UNCLEAR_REVIEW | DELIVERY_DAYS_UNCLEAR_REVIEW, LINE_TOTAL_MISMATCH_REVIEW, PAYMENT_DAYS_UNCLEAR_REVIEW |
| supplier-pack-10.pdf | REJECT | REJECT | Yes | DELIVERY_LATER_THAN_45_DAYS_REJECT, VAT_UNCLEAR_REVIEW | DELIVERY_LATER_THAN_45_DAYS_REJECT, VAT_UNCLEAR_REVIEW |

## Rule and decision mismatches

No decision or rule-ID mismatches were found in this evaluation run.

## Rule and defect notes

- supplier-pack-06.pdf: at least one finding has no page or evidence snippet.
- supplier-pack-08.pdf: at least one finding has no page or evidence snippet.
- supplier-pack-10.pdf: at least one finding has no page or evidence snippet.

## Extracted field status totals

- Extracted: 233
- Missing: 5
- Unclear: 2

## Scope note

Processing was performed only when the evaluation command was explicitly run on the 10 assessment PDFs. The normal application does not automatically load or process assessment samples.
