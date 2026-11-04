# QUVI — Architecture & Workflow Diagrams

**Project:** QUVI supplier quotation checker  
**Scenario:** Aamar Garments Ltd (fictional)  
**Document purpose:** Visual companion to the project overview, technical architecture, implementation specification, business rules, and evaluation plan.

> These diagrams represent the proposed prototype design. Update them if implementation decisions change. Mermaid diagrams can be rendered by GitHub, many Markdown viewers, Mermaid Live Editor, and supported IDE extensions.

## Diagram index
1. Proposed end-to-end pipeline
2. System architecture
3. Hybrid extraction strategy
4. State model design
5. Fixed processing pipeline
6. Batch lifecycle
7. Evaluation workflow
8. Decision precedence / outcome flow
9. Human review lifecycle

---

## 1. Proposed end-to-end pipeline

```mermaid
flowchart TD
    A[Procurement user uploads supplier quote PDF] --> B[Validate file and create document record]
    B --> C[Extract page-level PDF text]
    C --> D{Text extraction sufficient?}
    D -- Yes --> E[Structured LLM extraction]
    D -- No --> F[OCR fallback for low-text pages]
    F --> E
    E --> G[Pydantic schema validation]
    G --> H[Normalize safe values and preserve source evidence]
    H --> I[Match quote line items to PR-2026-114]
    I --> J[Deterministic policy engine]
    J --> K[Build findings and evidence]
    K --> L[Persist run, extraction, findings, and system decision]
    L --> M{System decision}
    M -- APPROVE --> N[Show approved result]
    M -- REJECT --> O[Show rejected result and rule evidence]
    M -- NEEDS_HUMAN_REVIEW --> P[Human review queue]
    P --> Q[Record reviewer decision and note separately]
    Q --> R[Show system and reviewer outcomes]
```

**Key principle:** extraction may use AI; policy outcomes are computed by deterministic application code. Uncertainty routes to human review.

---

## 2. System architecture diagram / design

```mermaid
flowchart TB
    subgraph Client["Client layer"]
        UI[Next.js + TypeScript UI]
        UP[Batch upload and progress]
        DR[Document result and evidence]
        HR[Human review panel]
        UI --> UP
        UI --> DR
        UI --> HR
    end

    subgraph API["FastAPI application — modular monolith"]
        ROUTES[API routes]
        ORCH[Processing orchestrator]
        INTAKE[File intake and validation]
        PDF[PDF text extraction adapter]
        OCR[OCR adapter]
        EXTRACT[LLM extraction adapter]
        VALIDATE[Pydantic validation and normalization]
        MATCH[Purchase request matcher]
        RULES[Deterministic policy engine]
        EVIDENCE[Evidence builder]
        REVIEW[Human review service]
        EVAL[Evaluation runner]
        ROUTES --> ORCH
        ORCH --> INTAKE --> PDF
        PDF --> OCR
        PDF --> EXTRACT
        OCR --> EXTRACT
        EXTRACT --> VALIDATE --> MATCH --> RULES --> EVIDENCE
        ROUTES --> REVIEW
        EVAL --> ORCH
    end

    subgraph Storage["Persistence"]
        DB[(SQLite metadata, runs, findings, decisions, reviews)]
        FILES[(Local PDF storage)]
        PR[(Purchase request data)]
    end

    UP --> ROUTES
    DR --> ROUTES
    HR --> ROUTES
    INTAKE --> FILES
    ORCH --> DB
    EVIDENCE --> DB
    REVIEW --> DB
    MATCH --> PR
```

**Prototype stack:** Next.js, TypeScript, Tailwind, shadcn/ui; Python, FastAPI, Pydantic; PyMuPDF; Tesseract OCR fallback; LLM adapter; SQLite; local file storage; pytest.

---

## 3. Hybrid extraction strategy

```mermaid
flowchart TD
    A[PDF file] --> B[Inspect file type, size, page count]
    B --> C[PyMuPDF page text extraction]
    C --> D{Page has sufficient usable text?}
    D -- Yes --> E[Keep extracted text and page provenance]
    D -- No --> F[Tesseract OCR on affected page]
    F --> G[Keep OCR text and OCR provenance]
    E --> H[Combine page-labelled text]
    G --> H
    H --> I[LLM extracts schema-defined fields only]
    I --> J[Pydantic parsing and validation]
    J --> K{Critical values valid and supported?}
    K -- Yes --> L[Normalize values; retain exact evidence]
    K -- No --> M[Mark missing, ambiguous, or not evaluable]
    L --> N[PR matching and deterministic policy checks]
    M --> N
    N --> O[Decision + findings + evidence]
```

### Responsibility split

| Component | Responsibility | Must not do |
|---|---|---|
| PDF text reader | Extract embedded text page by page | Infer missing content |
| OCR fallback | Read low-text/scanned pages | Silently replace the original source |
| LLM extractor | Return schema-shaped fields and evidence | Decide Approve/Reject |
| Pydantic validation | Check structure and data types | Guess missing values |
| Normalizer | Apply explicit unit/date/currency mappings | Alter source evidence |
| Rule engine | Apply company thresholds deterministically | Depend on model prose |
| Evidence builder | Link finding to excerpt and page | Invent citations/evidence |

---

## 4. State model design

The **processing state**, **business decision**, and **human review state** are independent dimensions. Avoid using one status field to represent all three.

```mermaid
stateDiagram-v2
    state "Processing status" as Processing {
        [*] --> QUEUED
        QUEUED --> PROCESSING
        PROCESSING --> COMPLETED
        PROCESSING --> FAILED
        FAILED --> PROCESSING: Explicit reprocess / new run
    }

    state "System decision (only after meaningful evaluation)" as Decision {
        [*] --> NOT_AVAILABLE
        NOT_AVAILABLE --> APPROVE
        NOT_AVAILABLE --> REJECT
        NOT_AVAILABLE --> NEEDS_HUMAN_REVIEW
    }

    state "Human review status" as Review {
        [*] --> NOT_REQUIRED
        NOT_REQUIRED --> PENDING: Needs human review
        PENDING --> REVIEWED
        REVIEWED --> PENDING: Reopen / new run requires review
    }
```

### State definitions

| Dimension | Values | Meaning |
|---|---|---|
| Document processing | `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED` | Technical execution lifecycle |
| System decision | `APPROVE`, `REJECT`, `NEEDS_HUMAN_REVIEW`, null | Policy outcome; null if no valid result exists |
| Human review | `NOT_REQUIRED`, `PENDING`, `REVIEWED` | Human review lifecycle |
| Batch | `QUEUED`, `PROCESSING`, `COMPLETED`, `PARTIAL_FAILURE`, `FAILED` | Aggregate status derived from child documents |

A processing failure is not a Reject. A completed document can have a Needs Human Review decision.

---

## 5. Fixed processing pipeline

```mermaid
flowchart LR
    A[1. Intake] --> B[2. PDF text extraction]
    B --> C[3. OCR fallback if needed]
    C --> D[4. Structured LLM extraction]
    D --> E[5. Schema validation]
    E --> F[6. Normalization]
    F --> G[7. PR item matching]
    G --> H[8. Deterministic rules]
    H --> I[9. Evidence assembly]
    I --> J[10. Persist result]
```

### Step contracts
1. **Intake:** verify PDF signature, configured size/page limits, hash, and safe storage name.
2. **PDF text extraction:** extract page-level text and quality signals.
3. **OCR fallback:** OCR only low-text or scanned pages; preserve provenance.
4. **Structured extraction:** LLM returns only fields defined by the schema.
5. **Validation:** parse typed fields; reject malformed output; retain null for missing/unclear values.
6. **Normalization:** normalize only with explicit mappings; keep raw text.
7. **PR matching:** match line item identity and unit; flag uncertain matches.
8. **Rules:** apply versioned thresholds in deterministic code.
9. **Evidence:** include exact snippet, page, field/rule link, and extraction source.
10. **Persistence:** save run/version, extraction, findings, decision, and processing state.

---

## 6. Batch lifecycle

```mermaid
flowchart TD
    A[User selects multiple PDFs] --> B[Validate each file independently]
    B --> C[Create batch + document records]
    C --> D[Queue accepted documents]
    D --> E[Process document using shared fixed pipeline]
    E --> F{Document completed?}
    F -- Yes --> G[Persist result and decision]
    F -- No --> H[Persist file-level error]
    G --> I[Update batch aggregates]
    H --> I
    I --> J{Any documents still active?}
    J -- Yes --> E
    J -- No --> K{Terminal outcome mix}
    K -- All succeeded --> L[Batch COMPLETED]
    K -- Success and failures --> M[Batch PARTIAL_FAILURE]
    K -- All failed --> N[Batch FAILED]
    L --> O[Display per-file results]
    M --> O
    N --> O
```

### Batch status rules
- `QUEUED`: none started.
- `PROCESSING`: at least one document is active.
- `COMPLETED`: all documents terminal and no file-level failures.
- `PARTIAL_FAILURE`: terminal set contains both successful and failed documents.
- `FAILED`: all documents failed.

**Important:** `NEEDS_HUMAN_REVIEW` is a business outcome, not a batch-processing failure. A batch may be `COMPLETED` while one or more documents need review.

---

## 7. Evaluation workflow

```mermaid
flowchart TD
    A[Collect available supplier packs] --> B[Create separate ground truth and record its author]
    B --> C[Label fields, decisions, findings, and evidence]
    C --> D[Review labels / resolve ambiguities]
    D --> E[Freeze evaluation set and rule version]
    E --> F[Run QUVI on same files]
    F --> G[Compare extraction and decisions with ground truth]
    G --> H[Calculate metrics]
    H --> I[Inspect false approvals, missed rules, and evidence gaps]
    I --> J[Document limitations and next steps]
    J --> K{Change prompt, schema, or rules?}
    K -- Yes --> L[Version change and regression test]
    L --> F
    K -- No --> M[Publish honest test report]
```

### Evaluation metrics
- Decision accuracy.
- Critical-field exactness.
- Hard-reject recall.
- Review-routing recall.
- False approval rate.
- Evidence coverage.
- Batch resilience.
- Per-document and total latency.

For a ten-file set, include raw counts with percentages. At preparation time, only supplier packs 01 and 02 were available; update the dataset count once remaining packs are provided.

---

## 8. Decision precedence / outcome flow

```mermaid
flowchart TD
    A[Evaluate every applicable policy rule] --> B[Record PASS, TRIGGERED, or NOT_EVALUABLE]
    B --> C{Any confirmed Reject finding?}
    C -- Yes --> D[System decision: REJECT]
    C -- No --> E{Any Review or Not Evaluable finding?}
    E -- Yes --> F[System decision: NEEDS_HUMAN_REVIEW]
    E -- No --> G[System decision: APPROVE]
    D --> H[Preserve all findings and evidence]
    F --> H
    G --> H
```

Policy findings must be retained even when a Reject finding takes precedence over Review findings. Do not let a model-generated narrative override this rule.

---

## 9. Human review lifecycle

```mermaid
sequenceDiagram
    participant U as Procurement User
    participant A as QUVI API
    participant P as Policy Engine
    participant R as Reviewer
    participant DB as Database

    U->>A: Upload quote
    A->>P: Run extraction and policy checks
    P-->>A: System decision + findings + evidence
    A->>DB: Save immutable processing run
    A-->>U: Show result
    alt Needs human review
        U->>R: Open review item
        R->>A: Submit reviewer decision and note
        A->>DB: Append review record
        A-->>R: Review recorded
    end
    Note over DB: System decision remains preserved separately from reviewer outcome
```

---

## Implementation notes
- Keep batch and single-document paths on one processing function.
- Use Decimal/fixed precision for monetary comparisons.
- Preserve exact evidence and page references.
- Keep LLM/provider integration behind an adapter.
- Version prompt, schema, pipeline, and rules.
- Avoid fake confidence scores; uncertainty should be explicit.
- Treat all supplier PDF text as untrusted data, not instructions.
