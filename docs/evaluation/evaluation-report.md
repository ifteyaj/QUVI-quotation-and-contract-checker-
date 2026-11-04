# QUVI assessment evaluation report

- Generated: 2026-11-04T08:43:16.250042+00:00
- Evaluation version: 1.0.0
- Rule version: aamar-garments-rules-v1
- Source revision: 5ff73e9
- Ground truth: `/Users/ifteyajahmed/Desktop/BIAI-AI-Engineer-Round2-Pack/QUVI/QUVI-quotation-and-contract-checker-/docs/evaluation/ground-truth.json`
- Assessment directory: `/Users/ifteyajahmed/Desktop/BIAI-AI-Engineer-Round2-Pack/QUVI/QUVI-quotation-and-contract-checker-/docs/assessment`
- Ground-truth reviewer: QUVI implementer (AI coding assistant) — not an independent reviewer
- Ground-truth authored: 2026-11-04

## Ground-truth provenance

NOT INDEPENDENT. These expected outcomes were written by the same AI coding assistant that implemented the QUVI extraction and rule engine, after that engine already existed. They were derived rule-by-rule from docs/assessment/company-rules.md, docs/assessment/purchase-request.csv, and the 10 supplier PDFs rather than copied from engine output, but they are a regression baseline, not independent human validation. A genuinely independent check requires a person who has not seen the implementation to re-derive the expected decisions.

Derivation order: the rule engine was implemented first, then this file was authored from the policy, purchase request, and PDF text. No expected value was taken from evaluation-results.json. Because the author and implementer are the same, treat the 10/10 result as evidence of internal consistency, not as proof of correctness.

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
| supplier-pack-09.pdf | NEEDS_HUMAN_REVIEW | NEEDS_HUMAN_REVIEW | Yes | LINE_TOTAL_MISMATCH_REVIEW, PAYMENT_DAYS_UNCLEAR_REVIEW | LINE_TOTAL_MISMATCH_REVIEW, PAYMENT_DAYS_UNCLEAR_REVIEW |
| supplier-pack-10.pdf | REJECT | REJECT | Yes | DELIVERY_LATER_THAN_45_DAYS_REJECT, VAT_UNCLEAR_REVIEW | DELIVERY_LATER_THAN_45_DAYS_REJECT, VAT_UNCLEAR_REVIEW |

## Rule and decision mismatches

No decision or rule-ID mismatches were found in this evaluation run.

## Judgment calls and ambiguities

- **supplier-pack-05.pdf**: Judgment call: the payment clause repeats itself ('40% advance payable with the purchase order. 40% advance with the purchase order, balance 60% within 30 days of delivery.'). The two statements agree on 40% advance and the balance makes the schedule add up to 100%, so this is treated as redundant wording rather than a contradiction. The 40% figure is clearly stated and deterministically extractable, therefore ADVANCE_PAYMENT_ABOVE_LIMIT_REJECT applies. The alternative strict reading — that duplicated wording is ambiguous enough to send to a person — is defensible; it was not chosen because both copies state the same advance percentage and nothing in the clause contradicts 40%.
- **supplier-pack-09.pdf**: The delivery term uses weeks while policy thresholds are in days. A week-to-day conversion is exact (4 weeks = 28 days), so it is normalized deterministically rather than treated as unclear. Delivery does not contribute a finding for this document.
- **supplier-pack-10.pdf**: The price is marked 'BDT, VAT included', so the separately shown 15% VAT rule cannot be evaluated against a standalone VAT line.

## Rule and defect notes

- supplier-pack-06.pdf: at least one finding has no page or evidence snippet.
- supplier-pack-08.pdf: at least one finding has no page or evidence snippet.
- supplier-pack-10.pdf: at least one finding has no page or evidence snippet.

## Extracted field status totals

- Extracted: 234
- Missing: 5
- Unclear: 1

## Scope note

Processing was performed only when the evaluation command was explicitly run on the 10 assessment PDFs. The normal application does not automatically load or process assessment samples.
