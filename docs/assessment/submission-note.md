# QUVI — Submission Note

**Project:** QUVI — Supplier Quote Checker  
**Challenge:** BIAI AI Engineer Round 2, Task 1  
**Organization in scenario:** Aamar Garments Ltd (fictional)

This repository uses only the fictional sample files supplied with the brief. No real company or customer data is included.

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
- Evidence snippets for several packs (for example 03, 04, 07, 09) start or end mid-word in the stored JSON; the frontend hides these and shows "Source line unavailable".
- There is no review queue, login, or audit trail; human review exists only as a decision outcome shown in the UI.

## Testing and results

- 10 of 10 sample decisions match the rule reading in the ground truth; this is a regression baseline, not independent validation.
- Backend tests: `python -m pytest -q -p no:cacheprovider` — 38 passed at commit `1846855` (PyMuPDF/SWIG deprecation warnings only).
- Frontend: `npm run build` and `npm run lint` pass (verified at commit `1846855`).
- UI spot check (04 Nov 2026): dashboard and detail pages for packs 02, 03 and 08 render the extracted values, merged TIN/BIN bar, findings and pagination as expected.

## Links

- Repository: https://github.com/ifteyaj/QUVI-quotation-and-contract-checker-
- Demo: TBD
- Walkthrough: TBD
