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




## Documents
1. [Project overview](docs/project-overview.md) — purpose, scope, users, principles, and success criteria.
2. [Technical architecture](docs/architecture.md) — components, fixed pipeline, stack, persistence, safety, and architecture decisions.
3. [Implementation specification](docs/implementation-spec.md) — screens, states, fields, API outline, and implementation requirements.
4. [Business rules](docs/business-rules.md) — supplied policy, threshold interpretation, decision precedence, and purchase request.
5. [Evaluation and test plan](docs/evaluation-test-plan.md) — ground truth, metrics, test cases, acceptance criteria, and reporting.
6. [Batch workflow](docs/batch-workflow.md) — batch lifecycle, file isolation, statuses, resilience, and UI.
7. [API and data model](docs/api-and-data-model.md) — endpoint inventory and conceptual entities.
8. [Architecture diagrams](docs/architecture-diagrams.md) — Mermaid diagrams for pipeline, state, batch, and review flows.
9. [Data dictionary](docs/data-dictionary.md) — field definitions, types, validation rules, and PR reference data.
10. [Decision log](docs/decisions.md) — architecture and policy decision records.
11. [Product requirements](docs/prd.md) — product goals, functional requirements, and acceptance criteria.
12. [Prompt design](docs/prompt-design.md) — LLM extraction prompt, safety, and validation approach.
13. [Submission note](docs/assessment/submission-note.md) — challenge submission summary and outcomes.
14. [Test report](docs/assessment/test-report.md) — test execution template and evaluation records.

## Important source-data note
The challenge brief/README describes ten supplier packs. All ten (`supplier-pack-01.pdf` through `supplier-pack-10.pdf`) are present in `docs/assessment/`. They are fictional sample documents and are processed only when the evaluation command is explicitly run.

## Evaluation status
The evaluation harness runs the 10 supplied PDFs against `docs/evaluation/ground-truth.json` and currently reports 10/10 decisions and 10/10 rule-ID sets. The ground truth was authored by the QUVI implementer (AI coding assistant) after the rule engine existed, so this is a regression baseline, not independent human validation. See `docs/evaluation/evaluation-report.md` and `docs/decisions.md` (ADR-012).

## Suggested build order
1. Repository skeleton, configuration, typed models, and policy tests.
2. PDF intake and text extraction.
3. Structured extraction adapter and Pydantic validation.
4. Purchase request matching and deterministic rule engine.
5. Evidence/result persistence and single-document API.
6. Batch workflow and resilient status aggregation.
7. Frontend screens and human review.
8. Evaluation harness, sample run, README, demo, and one-page submission note.


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

Current high-level layout:

- `README.md` — project overview and documentation index
- `AGENTS.md` — AI coding assistant instructions for the repository root
- `docs/` — project, architecture, API, policy, and assessment documentation
- `frontend/` — Next.js frontend application
- `backend/` — FastAPI backend, Python virtual environment, and backend entrypoint
- `frontend/AGENTS.md` — Next.js-specific AI coding instructions for the app directory

Planned or future application areas described in earlier planning included `apps/web`, `services/api`, and `tests/`; the current implementation uses `frontend/` and `backend/` instead. Update this section if the physical layout changes.

## Getting started

Backend:

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend
npm run dev
```

Useful URLs:

- Frontend: http://localhost:3000
- New Verification: http://localhost:3000/verifications/new
- Backend health: http://localhost:8000/health
- Backend docs: http://localhost:8000/docs


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
