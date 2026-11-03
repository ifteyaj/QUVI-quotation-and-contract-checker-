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
- AI: schema-constrained LLM extraction; the LLM does not make the final policy decision.
- Rules: deterministic Python policy engine.
- Storage: SQLite and local file storage for the prototype.

> Update this section to reflect the exact libraries, model/provider, and architecture actually implemented.

## Testing and results
**To be completed after implementation and execution.** Report actual automated test outcomes and sample evaluation results. Do not insert hypothetical accuracy or claim all ten samples were evaluated unless they were actually available and processed.

## Limitations
- Extraction quality depends on PDF readability, layout, OCR, and model behavior.
- Ambiguous or missing information is routed to human review.
- The prototype is not an autonomous purchasing system and does not issue purchase orders or contact suppliers.
- The supplied policy has an ambiguity about a penalty clause that exists but is below the stated 0.5% per-week minimum; the prototype should route this to human review unless clarified.
- The challenge materials describe ten supplier packs; at the time of preparation, only packs 01 and 02 were available. Update this statement based on the final dataset.

## Next steps
1. Complete implementation and regression tests.
2. Label the full sample set and run the evaluation.
3. Review false approvals, extraction failures, and evidence coverage.
4. Improve UI and documentation based on observed results.
5. Prepare demo walkthrough and update this note with actual outcomes.

## Links
- Repository: `TBD`
- Demo: `TBD`
- Walkthrough: `TBD`
