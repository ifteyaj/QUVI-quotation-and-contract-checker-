# QUVI — Product Requirements Document

**Status:** Prototype requirements  
**Product:** QUVI  
**Organization in scenario:** Aamar Garments Ltd (fictional)

## 1. Problem
Procurement staff receive supplier quotations in varying PDF layouts. Manually checking quoted prices, quantities, payment and delivery terms, tax identifiers, VAT, validity, and penalties against a purchase request is repetitive and error-prone.

## 2. Product goal
Provide a transparent first-pass checker that extracts quote information, compares it against the relevant purchase request and company policy, and gives reviewers a decision with supporting evidence.

## 3. Users
- Procurement staff who upload supplier quotes.
- Human reviewers who resolve flagged cases.
- Evaluators who inspect the system's reliability, traceability, and limitations.

## 4. Core user stories
1. As a user, I can upload one PDF quote and receive a structured result.
2. As a user, I can upload several PDFs as a batch and track each file independently.
3. As a user, I can see extracted supplier, quote, line-item, and term information.
4. As a user, I can see how each quote item matches the purchase request.
5. As a user, I can see each triggered rule and the source evidence behind it.
6. As a reviewer, I can record a decision and note without overwriting the system's original decision.
7. As a user, I can distinguish processing errors from business outcomes.
8. As an evaluator, I can review test coverage and honest results on the available sample set.

## 5. Functional requirements
- Accept PDF files only and validate file signature, size, and page count.
- Extract page-level text; invoke OCR for low-text/scanned pages.
- Extract a typed, schema-constrained representation using an LLM adapter.
- Validate and normalize extracted values.
- Match quote line items against PR-2026-114.
- Apply the documented policy using deterministic code.
- Produce `APPROVE`, `REJECT`, or `NEEDS_HUMAN_REVIEW`.
- Attach exact evidence snippets and page references to findings where possible.
- Process batch files independently; isolate failures.
- Persist batch, document, processing run, extraction, finding, decision, and review records.
- Support reprocessing with version history.
- Provide a reviewer action and review history.

## 6. Decision requirements
- Any confirmed Reject rule produces `REJECT`.
- Otherwise, any Review or not-evaluable critical check produces `NEEDS_HUMAN_REVIEW`.
- `APPROVE` is permitted only if all applicable checks pass.
- Keep all findings even if Reject takes precedence.
- The processing status is independent of the business decision.

## 7. Non-functional requirements
- Reproducible local setup.
- Explainable and deterministic policy evaluation.
- Clear file-level error handling.
- Basic upload safety and secret management.
- Accessible, legible status and evidence UI.
- Automated tests for policy boundaries, validation, batch resilience, and review behavior.

## 8. Out of scope
- Automatic purchase order creation or sending.
- Supplier communication or contract signing.
- Production authentication/authorization and enterprise compliance controls in the prototype.
- Legal advice.
- Guaranteed handling of every document format, language, or layout.

## 9. Acceptance criteria
- A valid PDF can be uploaded and processed.
- Multiple PDFs can be processed without one failure aborting the batch.
- Results show decision, findings, and evidence.
- Missing or ambiguous values do not silently pass.
- System decision and reviewer decision remain separately available.
- Tests and actual sample evaluation results are reported without invented metrics.

## 10. Known data limitation
The brief describes ten supplier packs. Only packs 01 and 02 were available in the workspace when this documentation was prepared. The full evaluation remains pending receipt of packs 03–10.
