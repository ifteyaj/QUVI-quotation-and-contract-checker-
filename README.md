# QUVI

**Clarity in every quote.**

QUVI is an AI-assisted supplier quotation and contract verification tool for procurement teams. It helps reviewers compare supplier documents against a purchase requisition and company policy, while keeping the evidence and reasons behind each outcome visible.

> **Project status:** Early development. The repository currently contains the project README; implementation and setup instructions will be added as the project evolves.

## The problem

Procurement teams often need to review supplier quotations and contract terms manually. Important details can be buried in PDFs, and inconsistent review processes make it easy to miss pricing, quantity, payment, tax, or delivery issues.

QUVI is being built to make those checks more consistent and explainable.

## What QUVI aims to do

- Extract supplier, item, quantity, unit price, delivery, and contract details from documents.
- Compare quoted items and values with the purchase requisition.
- Evaluate contract terms against configurable procurement rules.
- Return a clear outcome for each quote: **Approve**, **Reject**, or **Needs human review**.
- Show the evidence and reasons supporting each finding.
- Escalate uncertain or unreadable information instead of guessing.

## Design principles

- **Evidence over assumptions:** retain source details for extracted values and findings.
- **AI extracts; deterministic rules decide:** language models assist with document understanding, while explicit policy checks determine outcomes.
- **Human review when uncertain:** ambiguous or insufficient information is surfaced for a person.
- **Explainable outcomes:** reviewers should be able to understand why a document received its result.
- **Document isolation:** processing one supplier's files should not contaminate another supplier's review.

## Planned technology

The implementation is planned around:

- **Web app:** Next.js, TypeScript, Tailwind CSS, and shadcn/ui
- **API:** Python and FastAPI
- **PDF processing:** PyMuPDF, with Tesseract OCR as a fallback for scanned documents
- **Data validation:** Pydantic
- **Policy evaluation:** deterministic Python rules
- **Storage:** SQLite and local file storage for the initial version
- **Testing:** pytest

This is the intended stack; components may change as development and evaluation progress.

## Project structure

The repository structure will be introduced incrementally. The planned application areas are:

- `apps/web` — web interface
- `services/api` — document processing and verification API
- `tests` — automated tests and evaluation cases
- `docs/` — project and implementation documentation

## Getting started

Run instructions will be added once the initial application scaffold is committed. At this stage, there is no runnable application in the repository yet.

## Evaluation

QUVI is intended to be evaluated against the supplied sample quotations, contracts, purchase requisition, and rule list. Evaluation should report:

- Correctness of the final decision for each sample
- Whether findings are supported by document evidence
- How uncertain cases are routed to human review
- Known limitations and next steps

Only authorized sample materials should be used during evaluation. Do not use real company or customer documents.

## Roadmap

- [ ] Define product requirements and verification workflow
- [ ] Implement document ingestion and extraction
- [ ] Implement purchase requisition comparison
- [ ] Implement deterministic policy checks
- [ ] Build reviewer interface and evidence display
- [ ] Add automated tests and sample-based evaluation
- [ ] Document local setup and run a demo

## License

A license has not been selected yet.
