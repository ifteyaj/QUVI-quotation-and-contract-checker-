export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export interface ExtractedPageResponse {
  page_number: number;
  text: string;
}

export interface ExtractedFieldResponse<T = string | number | boolean | null> {
  status: "EXTRACTED" | "MISSING" | "UNCLEAR";
  value: T | null;
  evidence: FieldEvidenceResponse[];
}

export interface FieldEvidenceResponse {
  page_number: number;
  snippet: string;
  source: string;
}

export interface ExtractedLineItemResponse {
  item_code: ExtractedFieldResponse<string>;
  description: ExtractedFieldResponse<string>;
  quoted_quantity: ExtractedFieldResponse<number | string>;
  quoted_unit: ExtractedFieldResponse<string>;
  quoted_unit_price: ExtractedFieldResponse<number | string>;
  line_total: ExtractedFieldResponse<number | string>;
  currency: ExtractedFieldResponse<string>;
  evidence: FieldEvidenceResponse[];
}

export interface ExtractedQuotationResponse {
  supplier_name: ExtractedFieldResponse<string>;
  supplier_tin: ExtractedFieldResponse<string>;
  supplier_bin: ExtractedFieldResponse<string>;
  quotation_number: ExtractedFieldResponse<string>;
  quotation_date: ExtractedFieldResponse<string>;
  reference_pr_number: ExtractedFieldResponse<string>;
  currency: ExtractedFieldResponse<string>;
  quoted_items: ExtractedLineItemResponse[];
  payment_terms: ExtractedFieldResponse<string>;
  advance_percent: ExtractedFieldResponse<number | string>;
  payment_days_after_delivery: ExtractedFieldResponse<number | string>;
  delivery_period: ExtractedFieldResponse<string>;
  delivery_days: ExtractedFieldResponse<number | string>;
  vat_rate_percent: ExtractedFieldResponse<number | string>;
  vat_separately_shown: ExtractedFieldResponse<boolean>;
  quotation_validity_days: ExtractedFieldResponse<number | string>;
  late_penalty_clause_present: ExtractedFieldResponse<boolean>;
  late_penalty_rate_per_week_percent: ExtractedFieldResponse<number | string>;
  extraction_notes: string[];
  extraction_method: string;
}

export interface MatchResultResponse {
  quoted_item_index: number;
  match_id: string;
  match_status: string;
  match_method: string | null;
  match_basis: string[];
  quoted_item_code: string | null;
  quoted_description: string | null;
  quoted_quantity: string | null;
  quoted_unit: string | null;
  quoted_unit_price: string | null;
  quoted_line_total: string | null;
  matched_pr_item_code: string | null;
  matched_pr_description: string | null;
  matched_pr_unit: string | null;
  requested_quantity: string | null;
  maximum_unit_price: string | null;
  quantity_variance_percent: string | null;
  price_variance_percent: string | null;
  line_total_calculation_expected: string | null;
  line_total_matches: boolean | null;
  currency_matches: boolean | null;
  notes: string[];
}

export interface VerificationFindingResponse {
  finding_id: string;
  rule_id: string;
  rule_version: string;
  severity: "REJECT" | "REVIEW" | "INFO";
  status: string;
  title: string;
  message: string;
  confirmed: boolean;
  field_path: string | null;
  observed_value: unknown;
  expected_value: unknown;
  page_number: number | null;
  evidence_text: string | null;
  related_quoted_item_code: string | null;
  related_pr_item_code: string | null;
}

export interface DecisionResponse {
  decision: "APPROVE" | "REJECT" | "NEEDS_HUMAN_REVIEW";
  decision_summary: string;
  rule_version: string;
  confirmed_reject_count: number;
  review_count: number;
  confirmed_review_count: number;
  uncertain_review_count: number;
}

export interface VerificationResultResponse {
  purchase_request_number: string | null;
  purchase_request_items: Array<{
    item_code: string;
    description: string;
    unit: string;
    requested_quantity: string;
    maximum_unit_price: string;
    currency: string;
  }>;
  match_results: MatchResultResponse[];
  unmatched_quoted_items: string[];
  duplicate_pr_matches: string[];
  findings: VerificationFindingResponse[];
  decision: DecisionResponse;
  verification_notes: string[];
}

export interface UploadedDocumentResult {
  document_id: string;
  original_filename: string;
  stored_filename: string;
  content_type: string;
  size_bytes: number;
  sha256: string;
  processing_status: string;
  page_count: number;
  text_char_count: number;
  extraction_method: string;
  needs_ocr: boolean;
  pages: ExtractedPageResponse[];
  extracted_text: string;
  quotation_extraction: ExtractedQuotationResponse;
  verification_result: VerificationResultResponse;
  created_at: string;
}

export interface RejectedFileResult {
  filename: string;
  error_code: string;
  message: string;
}

export interface BatchUploadResult {
  batch_id: string;
  purchase_request_id: string | null;
  created_at: string;
  documents: UploadedDocumentResult[];
  rejected_files: RejectedFileResult[];
}

export async function getApiErrorMessage(response: Response): Promise<string> {
  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    return `The request failed with status ${response.status}.`;
  }

  if (payload && typeof payload === "object") {
    const detail = (payload as { detail?: unknown }).detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (detail && typeof detail === "object") {
      const message = (detail as { message?: unknown }).message;
      if (typeof message === "string") {
        return message;
      }
    }

    const topLevelMessage = (payload as { message?: unknown }).message;
    if (typeof topLevelMessage === "string") {
      return topLevelMessage;
    }
  }

  return `The request failed with status ${response.status}.`;
}

export async function uploadQuotationBatch(
  files: File[],
  purchaseRequestId?: string
): Promise<BatchUploadResult> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  if (purchaseRequestId) {
    formData.append("purchase_request_id", purchaseRequestId);
  }

  // Do not set Content-Type manually; the browser supplies the multipart boundary.
  const response = await fetch(`${API_BASE_URL}/api/batches`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response));
  }

  return response.json() as Promise<BatchUploadResult>;
}

export interface PurchaseRequestItemResponse {
  item_code: string;
  description: string;
  unit: string;
  requested_quantity: string;
  maximum_unit_price: string;
  currency: string;
}

export interface PurchaseRequestResponse {
  pr_number: string;
  title: string;
  items: PurchaseRequestItemResponse[];
}

export async function getPurchaseRequest(
  prNumber: string
): Promise<PurchaseRequestResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/purchase-requests/${encodeURIComponent(prNumber)}`
  );

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response));
  }

  return response.json() as Promise<PurchaseRequestResponse>;
}

export async function listBatches(): Promise<BatchUploadResult[]> {
  const response = await fetch(`${API_BASE_URL}/api/batches`);
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response));
  }
  return response.json() as Promise<BatchUploadResult[]>;
}

export async function getBatch(batchId: string): Promise<BatchUploadResult> {
  const response = await fetch(`${API_BASE_URL}/api/batches/${encodeURIComponent(batchId)}`);
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response));
  }
  return response.json() as Promise<BatchUploadResult>;
}

export interface PolicyRuleGroupResponse {
  rule_version: string;
  source: string;
  approval: string;
  reject_rules: string[];
  review_rules: string[];
  notes: string[];
}

export async function getPolicyRules(): Promise<PolicyRuleGroupResponse> {
  const response = await fetch(`${API_BASE_URL}/api/rules`);
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response));
  }
  return response.json() as Promise<PolicyRuleGroupResponse>;
}

export async function listPurchaseRequests(): Promise<
  Array<{ pr_number: string; title: string; item_count: number }>
> {
  const response = await fetch(`${API_BASE_URL}/api/purchase-requests`);
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response));
  }
  return response.json() as Promise<
    Array<{ pr_number: string; title: string; item_count: number }>
  >;
}
