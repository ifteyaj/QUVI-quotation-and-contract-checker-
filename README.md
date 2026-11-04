# QUVI

**Clarity in every quote.**

QUVI is a supplier quotation verification prototype for procurement teams. It reads supplier quotation PDFs, compares them with a purchase request, checks them against company rules, and returns one of three outcomes for each document: **Approve**, **Reject**, or **Needs a person to check**. Each outcome lists its reasons and, where available, the source text.

This repository was built for the BIAI AI Engineer Round 2 assessment, Task 1 (supplier document checking). It uses only the fictional sample files supplied with the brief. No real company or customer data is included.

## What runs today

- PDF text extraction (PyMuPDF) and regex-based field extraction for supplier quotes.
- Matching of quoted items to purchase request PR-2026-114.
- A deterministic rule engine based on `docs/assessment/company-rules.md`.
- A FastAPI backend with batch upload, verification results and a source-file route.
- A Next.js dashboard, upload page, verification list and verification detail page.
- Pytest tests and a 10-pack run script.

No LLM or external AI API is called at runtime. The brief allowed AI coding tools during development; this project used an AI coding assistant (OpenCode with Claude) to write and review code.

## Requirements

- Python 3.9.6 (the version the tests were run on; newer versions may need dependency changes)
- Node.js 22.18.0 or newer, with npm

## Setup and run

### Backend

```bash
cd backend
python3.9 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m pytest -q -p no:cacheprovider
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Expected test result: `38 passed`. Deprecation warnings from PyMuPDF/SWIG are expected.

### Run the 10 sample packs

With the backend running, in a second terminal:

```bash
cd backend
source .venv/bin/activate
python scripts/real_run.py --packs ../docs/assessment
```

The script uploads each pack, prints the decision and findings, and saves JSON results to `backend/real-run-results/<timestamp>_<commit>/`. This folder is generated and ignored by Git.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. The frontend calls the backend at http://localhost:8000 by default.

Useful URLs:
- Dashboard: http://localhost:3000
- New verification: http://localhost:3000/verifications/new
- Backend health: http://localhost:8000/health
- Backend API docs: http://localhost:8000/docs

## Results on the sample set

On the 10 supplied packs, the system's decisions match the rule reading in `docs/evaluation/ground-truth.json`: 10 of 10 decisions and 10 of 10 rule-ID sets. The ground truth was written by the same AI assistant that built the rule engine, so this is a regression check, not independent validation. See `docs/evaluation/evaluation-report.md` and ADR-012 in `docs/decisions.md`.

## Limits

- **Extraction is tuned to these 10 layouts.** Three unseen custom quotes were tested. They did not produce false rejects, but most fields were not extracted and were routed to review.
- **Evidence snippets can start or end mid-word** in the stored results. The frontend hides these and shows "Source line unavailable".
- **TIN and BIN** are read only from the exact label `Supplier TIN:` / `BIN:`. Other wording is routed to review, not confirmed as absent.
- **Late-delivery penalty** absence is confirmed only when no penalty wording appears and a readable terms section is present.
- **Reviewer workflow** is limited to viewing results. There is no review queue, login or audit trail.

## Documents

1. [Project overview](docs/project-overview.md)
2. [Technical architecture](docs/architecture.md)
3. [Business rules](docs/business-rules.md)
4. [Evaluation and test plan](docs/evaluation-test-plan.md)
5. [Decision log](docs/decisions.md)
6. [Evaluation report](docs/evaluation/evaluation-report.md)
7. [Assessment files](docs/assessment/README.md)

## Repository layout

- `backend/` — FastAPI app, rule engine, extraction, tests, run script
- `frontend/` — Next.js app
- `docs/` — project, architecture, rules and decision documents
- `docs/assessment/` — the 10 supplied packs, purchase request and company rules (fictional)
- `docs/evaluation/` — ground truth and evaluation outputs
