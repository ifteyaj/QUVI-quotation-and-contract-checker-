# QUVI — Project Overview

## Project
**QUVI** is a supplier quotation and contract checker for **Aamar Garments Ltd**, a fictional garment company. It helps procurement staff review supplier quote documents against a purchase request and company policy.

## Problem
Supplier quotations may arrive as PDFs with different layouts and wording. Manually comparing prices, quantities, delivery promises, payment terms, tax identifiers, VAT, and penalties is repetitive and can miss important details. The system must be useful without pretending that uncertain evidence is certain.

## Objective
Build a working, explainable workflow that:
1. Extracts supplier and quote details from each PDF.
2. Compares the quote with the supplied purchase request.
3. Applies fixed company rules in a deterministic manner.
4. Returns **Approve**, **Reject**, or **Needs a person to check**.
5. Shows exact supporting text and source location for each finding.
6. Routes uncertainty to a human instead of guessing.

## Scope
### In scope
- One supplier document per evaluation record.
- Upload a single PDF or submit multiple PDFs as a batch.
- Text extraction from digitally generated PDFs, with OCR fallback for scanned pages.
- Structured extraction of fields with an LLM, constrained by a schema.
- Validation and rule evaluation in fixed, sequential Python steps.
- Evidence snippets, page references, findings, decision rationale, and human review.
- Local demo persistence and an evaluation report on provided sample documents.

### Out of scope for the initial version
- Autonomous purchasing, issuing purchase orders, signing contracts, or contacting suppliers.
- Free-running autonomous agents.
- Real company/customer documents or production-grade identity/access management.
- Legal advice or interpretation beyond the supplied policy.
- Automatic correction of source documents.
- Guaranteed support for every PDF layout or language.

## Users
- **Procurement reviewer:** uploads and checks supplier quotes.
- **Human approver:** resolves flagged findings and records a final review outcome.
- **Demo evaluator:** inspects decisions, evidence, test results, and implementation tradeoffs.

## Core principles
- **Fixed pipeline, not an autonomous agent.**
- **Evidence before decision:** extracted values must be traceable to source text.
- **Fail safely:** missing, ambiguous, inconsistent, or unsupported values lead to human review.
- **Rules are deterministic:** the model extracts; application code decides.
- **Decision provenance:** preserve the system decision and any human decision separately.
- **Honest evaluation:** report accuracy and limitations using the actual provided samples.

## Expected output for each document
- Supplier and quotation metadata.
- Extracted line items and terms.
- Purchase-request comparison.
- Rule findings with severity and exact evidence.
- System decision and reasons.
- Processing status, errors, and review status.
- Optional human reviewer decision, note, and timestamp.

## Project constraints
The challenge brief specifies a 72-hour implementation window, only supplied fictional sample files, a working code repository with run instructions, a demo link if available, a short Loom walkthrough, and a one-page note describing what was built, testing/results, limitations, and next steps.

## Success criteria
- All sample documents can be processed independently and as a batch.
- One bad file does not stop processing the remaining batch.
- Hard-reject conditions and review conditions are applied consistently.
- Each decision is explainable with exact quote evidence.
- Ambiguous evidence never silently becomes an approval.
- Tests cover policy boundaries, extraction validation, batch resilience, and reviewer actions.
