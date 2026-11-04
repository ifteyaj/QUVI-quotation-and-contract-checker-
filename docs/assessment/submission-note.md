# QUVI — Submission Note

**Project:** QUVI — Supplier Quote Checker  
**Challenge:** BIAI AI Engineer Round 2, Task 1  
**Organization in scenario:** Aamar Garments Ltd (fictional)

## What was built

QUVI processes supplier quotation PDFs and compares extracted quote details against purchase request PR-2026-114 and the supplied company rules. It returns Approve, Reject, or Needs a person to check, with reasons and source text where available. Each document is processed independently; a failure in one document does not stop the rest of its batch.

## What runs today

- PDF text extraction with PyMuPDF.
- Regex-based field extraction for supplier name, TIN, BIN, quotation number, prices, quantities, terms and other fields.
- Matching of quoted items to the purchase request.
- A deterministic Python rule engine based on `docs/assessment/company-rules.md`.
- A FastAPI backend with batch upload, verification results and a source-file route.
- A Next.js dashboard, upload page, verification list and verification detail page.

No LLM or external AI API is called at runtime. AI coding/design tools were used during development (OpenCode with Claude).

## Limits

- Extraction is tuned to the supplied layouts. Three unseen custom quotes did not trigger false rejects, but most of their fields were not extracted and were routed to review.
- TIN and BIN are read only from the exact labels `Supplier TIN:` / `BIN:`. Other wording is treated as not confirmed.
- Evidence snippets can begin or end mid-word; the frontend hides those and shows "Source line unavailable".
- There is no authentication, review queue, login or audit trail. Human review exists only as a decision outcome and the viewer-facing review link.
- UI recovery from a lost backend session is not implemented.

## Testing and results

- Backend tests: `python -m pytest -q -p no:cacheprovider` — 38 passed at commit `1846855` (PyMuPDF/SWIG deprecation warnings only).
- Frontend: `npm run build` and `npm run lint` pass.
- 10 supplied packs: 10 of 10 decisions and 10 of 10 rule-ID sets on the regression ground truth. This is a regression check only; the ground truth was written by the same implementer.
- UI spot check: dashboard and detail pages render the extracted values, merged TIN/BIN bar, findings and pagination as expected.

## Links

- Repository: https://github.com/ifteyaj/QUVI-quotation-and-contract-checker-
- Demo: TBD
- Walkthrough: TBD
