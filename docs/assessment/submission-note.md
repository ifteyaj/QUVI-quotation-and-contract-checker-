# QUVI — Submission Note

**Project:** QUVI — Supplier Quote Checker  
**Challenge:** BIAI AI Engineer Round 2, Task 1  
**Organization in scenario:** Aamar Garments Ltd (fictional)

## What I built
QUVI is a prototype that processes supplier quotation PDFs and compares extracted quote details against a purchase request and company policy. It uses a structured extraction step for variable document layouts, followed by deterministic Python validation and rule evaluation. The system returns Approve, Reject, or Needs Human Review with supporting evidence.

## Workflow
Users can upload a single PDF or multiple PDFs in a batch. Each document is processed independently through PDF text extraction, OCR fallback when needed, structured extraction, validation, purchase-request matching, policy checks, evidence assembly, and persistence. A failure in one document does not stop the remaining batch. Human review is recorded separately from the system decision.

## Technical approach
- Frontend: Next.js, TypeScript, Tailwind CSS, shadcn/ui.
- Backend: Python, FastAPI, Pydantic.
- PDF processing: PyMuPDF with Tesseract OCR fallback.
- AI: no runtime LLM/API. Extraction is regex-based and deterministic validation; the rule engine decides.
- Rules: deterministic Python policy engine.
- Storage: in-memory batch store and local file storage for the prototype.

> Update this section to reflect the exact libraries, model/provider, and architecture actually implemented.

## Testing and results
- Backend tests: `python -m pytest -q -p no:cacheprovider` — 38 passed (warnings from PyMuPDF/SWIG only).
- Sample evaluation: all 10 supplied packs processed; 10 of 10 decisions and 10 of 10 rule-ID sets match the regression ground truth. Three unseen custom quotes were also tested; they did not produce false rejects, but most fields were not extracted and were routed to review.

## Limitations
- Extraction quality depends on PDF readability, layout, OCR, and model behavior.
- Ambiguous or missing information is routed to human review.
- The prototype is not an autonomous purchasing system and does not issue purchase orders or contact suppliers.
- The supplied policy has an ambiguity about a penalty clause that exists but is below the stated 0.5% per-week minimum; the prototype should route this to human review unless clarified.
- All ten supplied packs were processed. On the regression ground truth the result was 10 of 10 decisions and 10 of 10 rule-ID sets, but the ground truth was written by the same implementer, so this is a regression check rather than independent validation.

## Next steps
1. Complete implementation and regression tests.
2. Label the full sample set and run the evaluation.
3. Review false approvals, extraction failures, and evidence coverage.
4. Improve UI and documentation based on observed results.
5. Prepare demo walkthrough and update this note with actual outcomes.

## Links
- Repository: https://github.com/ifteyaj/QUVI-quotation-and-contract-checker-
- Demo: `TBD`
- Walkthrough: `TBD`
