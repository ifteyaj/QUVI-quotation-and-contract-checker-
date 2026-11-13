import type {
  DecisionResponse,
  ExtractedFieldResponse,
  ExtractedQuotationResponse,
  UploadedDocumentResult,
  VerificationFindingResponse,
} from "@/lib/api";
import type { DashboardDocument } from "@/lib/dashboard";

/**
 * Fictional sample data for the landing-page product preview.
 *
 * Every supplier, quotation number, and verification outcome in this file is
 * fabricated for the `/dashboard/preview` route only. It never reaches the
 * backend and contains only clearly fictional sample content.
 */

function extracted<T>(value: T): ExtractedFieldResponse<T> {
  return { status: "EXTRACTED", value, evidence: [] };
}

function notExtracted<T>(): ExtractedFieldResponse<T> {
  return { status: "NOT_LOCATED", value: null, evidence: [] };
}

interface DemoFindingInput {
  id: string;
  ruleId: string;
  severity: VerificationFindingResponse["severity"];
  title: string;
  message: string;
}

function finding(input: DemoFindingInput): VerificationFindingResponse {
  return {
    finding_id: input.id,
    rule_id: input.ruleId,
    rule_version: "preview",
    severity: input.severity,
    status: input.severity === "REJECT" ? "confirmed_reject" : "open_review",
    title: input.title,
    message: input.message,
    confirmed: input.severity === "REJECT",
    field_path: null,
    observed_value: null,
    expected_value: null,
    page_number: 1,
    evidence_text: null,
    related_quoted_item_code: null,
    related_pr_item_code: null,
  };
}

function demoQuotation(
  supplierName: string,
  quotationNumber: string
): ExtractedQuotationResponse {
  return {
    supplier_name: extracted(supplierName),
    supplier_tin: notExtracted(),
    supplier_bin: notExtracted(),
    quotation_number: extracted(quotationNumber),
    quotation_date: notExtracted(),
    reference_pr_number: notExtracted(),
    currency: notExtracted(),
    quoted_items: [],
    payment_terms: notExtracted(),
    advance_percent: notExtracted(),
    payment_days_after_delivery: notExtracted(),
    delivery_period: notExtracted(),
    delivery_days: notExtracted(),
    vat_rate_percent: notExtracted(),
    vat_separately_shown: notExtracted(),
    quotation_validity_days: notExtracted(),
    late_penalty_clause_present: notExtracted(),
    late_penalty_rate_per_week_percent: notExtracted(),
    extraction_notes: [],
    extraction_method: "sample_data",
  };
}

interface DemoDocumentInput {
  id: string;
  supplier: string;
  quotationNumber: string;
  createdAt: string;
  decision: DecisionResponse["decision"];
  summary: string;
  rejectCount: number;
  reviewCount: number;
  findings: DemoFindingInput[];
}

function demoDocument(input: DemoDocumentInput): DashboardDocument {
  const decision: DecisionResponse = {
    decision: input.decision,
    decision_summary: input.summary,
    rule_version: "preview",
    confirmed_reject_count: input.rejectCount,
    review_count: input.reviewCount,
    confirmed_review_count: 0,
    uncertain_review_count: input.reviewCount,
  };

  const document: UploadedDocumentResult = {
    document_id: input.id,
    original_filename: `${input.id}.pdf`,
    stored_filename: `${input.id}.pdf`,
    content_type: "application/pdf",
    size_bytes: 0,
    sha256: "preview-sample-document",
    processing_status: "COMPLETED",
    page_count: 1,
    text_char_count: 0,
    extraction_method: "sample_data",
    needs_ocr: false,
    pages: [],
    extracted_text: "",
    quotation_extraction: demoQuotation(input.supplier, input.quotationNumber),
    verification_result: {
      purchase_request_number: "PR-2026-014",
      purchase_request_items: [],
      match_results: [],
      unmatched_quoted_items: [],
      duplicate_pr_matches: [],
      findings: input.findings.map(finding),
      decision,
      verification_notes: [],
    },
    created_at: input.createdAt,
  };

  return { batchId: "preview-batch", document };
}

export const PREVIEW_DOCUMENTS: DashboardDocument[] = [
  demoDocument({
    id: "preview-doc-a",
    supplier: "Delta Apparels Ltd.",
    quotationNumber: "QUO-2026-101",
    createdAt: "2026-11-12T10:12:00Z",
    decision: "APPROVE",
    summary: "Every policy check passed.",
    rejectCount: 0,
    reviewCount: 0,
    findings: [
      {
        id: "preview-finding-a1",
        ruleId: "LINE_ITEMS_MATCHED",
        severity: "INFO",
        title: "All line items matched the purchase request.",
        message: "Quantities and prices are within policy limits.",
      },
    ],
  }),
  demoDocument({
    id: "preview-doc-b",
    supplier: "Orion Textiles Ltd.",
    quotationNumber: "QUO-2026-102",
    createdAt: "2026-11-11T15:40:00Z",
    decision: "NEEDS_HUMAN_REVIEW",
    summary: "2 items require human review.",
    rejectCount: 0,
    reviewCount: 2,
    findings: [
      {
        id: "preview-finding-b1",
        ruleId: "QUANTITY_VARIANCE_GREATER_THAN_5_REVIEW",
        severity: "REVIEW",
        title: "Quantity differs from the purchase request by more than 5%",
        message: "Confirm the delivered quantity with the supplier.",
      },
      {
        id: "preview-finding-b2",
        ruleId: "DELIVERY_31_TO_45_DAYS_REVIEW",
        severity: "REVIEW",
        title: "Delivery falls in the 31–45 day review band",
        message: "Delivery is later than the preferred window.",
      },
    ],
  }),
  demoDocument({
    id: "preview-doc-c",
    supplier: "Meridian Knitwear Ltd.",
    quotationNumber: "QUO-2026-103",
    createdAt: "2026-11-10T09:05:00Z",
    decision: "REJECT",
    summary: "2 reject-level issues were found.",
    rejectCount: 2,
    reviewCount: 0,
    findings: [
      {
        id: "preview-finding-c1",
        ruleId: "ADVANCE_PAYMENT_ABOVE_LIMIT_REJECT",
        severity: "REJECT",
        title: "Advance payment exceeds the 20% limit",
        message: "The quoted advance is above the allowed rate.",
      },
      {
        id: "preview-finding-c2",
        ruleId: "LATE_PENALTY_MISSING_REJECT",
        severity: "REJECT",
        title: "No late penalty clause was found",
        message: "The quotation omits the required clause.",
      },
    ],
  }),
  demoDocument({
    id: "preview-doc-d",
    supplier: "Silverline Fabrics Ltd.",
    quotationNumber: "QUO-2026-104",
    createdAt: "2026-11-07T14:30:00Z",
    decision: "APPROVE",
    summary: "Every policy check passed.",
    rejectCount: 0,
    reviewCount: 0,
    findings: [
      {
        id: "preview-finding-d1",
        ruleId: "LINE_ITEMS_MATCHED",
        severity: "INFO",
        title: "All line items matched the purchase request.",
        message: "Quantities and prices are within policy limits.",
      },
    ],
  }),
  demoDocument({
    id: "preview-doc-e",
    supplier: "Crestline Packaging Ltd.",
    quotationNumber: "QUO-2026-105",
    createdAt: "2026-11-05T11:20:00Z",
    decision: "NEEDS_HUMAN_REVIEW",
    summary: "2 items require human review.",
    rejectCount: 0,
    reviewCount: 2,
    findings: [
      {
        id: "preview-finding-e1",
        ruleId: "PRICE_ABOVE_MAX_REVIEW_BAND",
        severity: "REVIEW",
        title: "Unit price is above the preferred price band",
        message: "The unit price needs a person to confirm.",
      },
      {
        id: "preview-finding-e2",
        ruleId: "PAYMENT_DAYS_UNPARSED_REVIEW",
        severity: "REVIEW",
        title: "Payment days could not be read from the quotation",
        message: "The payment terms are unclear.",
      },
    ],
  }),
];

export function previewCounts(documents: DashboardDocument[]) {
  return documents.reduce(
    (totals, { document }) => {
      const decision = document.verification_result.decision.decision;

      if (decision === "APPROVE") {
        totals.approved += 1;
      } else if (decision === "REJECT") {
        totals.rejected += 1;
      } else {
        totals.needsReview += 1;
      }

      return totals;
    },
    { total: documents.length, approved: 0, rejected: 0, needsReview: 0 }
  );
}
