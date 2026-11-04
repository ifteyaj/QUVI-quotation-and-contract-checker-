import type {
  ExtractedFieldResponse,
  ExtractedQuotationResponse,
  MatchResultResponse,
  PolicyRuleGroupResponse,
  VerificationFindingResponse,
  VerificationResultResponse,
} from "@/lib/api";

export type Outcome = "APPROVE" | "REJECT" | "NEEDS_HUMAN_REVIEW";
export type RowTone = "pass" | "review" | "reject";

// UI rule 9: an evidence snippet is only shown when it is long enough and both
// of its ends fall on word boundaries.
export const EVIDENCE_MIN_LENGTH = 40;

const NUMBER_FORMAT = new Intl.NumberFormat("en-US");

const DAY_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatMoney(value: string | null, currency: string | null): string {
  if (value === null || value === "") {
    return "—";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return `${currency ?? "BDT"} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPercentValue(value: string | number | null): string {
  if (value === null || value === "") {
    return "—";
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return "—";
  }

  return `${numeric.toFixed(2).replace(/\.?0+$/, "")}%`;
}

export function formatQuantity(value: string | null, unit: string | null): string {
  if (value === null || value === "") {
    return "—";
  }

  const numeric = Number(value);
  const formatted = Number.isFinite(numeric) ? NUMBER_FORMAT.format(numeric) : value;

  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatCheckedOn(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return `${DAY_FORMAT.format(date)} • ${TIME_FORMAT.format(date)}`;
}

export function extractedFieldValue(
  field: ExtractedFieldResponse<string | number> | undefined
): { text: string; missing: boolean } {
  if (
    !field ||
    field.status !== "EXTRACTED" ||
    field.value === null ||
    field.value === undefined ||
    field.value === ""
  ) {
    return { text: "Not extracted", missing: true };
  }

  return { text: String(field.value), missing: false };
}

export interface RuleThresholds {
  deliveryDays: string | null;
  penaltyRatePerWeekPercent: string | null;
}

export function parseRuleThresholds(
  rules: PolicyRuleGroupResponse | null
): RuleThresholds {
  const deliveryMatch = rules?.reject_rules
    .map((rule) => /later than (\d+) days/i.exec(rule))
    .find((match): match is RegExpExecArray => match !== null);

  const penaltyMatch = rules?.notes
    .map((note) => /at least ([\d.]+)%/i.exec(note))
    .find((match): match is RegExpExecArray => match !== null);

  return {
    deliveryDays: deliveryMatch?.[1] ?? null,
    penaltyRatePerWeekPercent: penaltyMatch?.[1] ?? null,
  };
}

export function evidenceLine(evidenceText: string | null): string {
  const value = evidenceText?.trim() ?? "";

  if (value.length < EVIDENCE_MIN_LENGTH) {
    return "Source line unavailable";
  }

  // The backend returns a window cut out of the page text. A window that starts
  // on a lowercase letter ("ments Ltd ...") or on the tail of a number
  // ("00 Total ...") begins mid-word, and one that stops on a hyphen or a
  // one/two letter fragment ends mid-word.
  if (/^[a-z]/.test(value)) {
    return "Source line unavailable";
  }

  if (/^\d{1,2}\s[A-Z]/.test(value)) {
    return "Source line unavailable";
  }

  if (/^[A-Z]{3,12}\s+\d/.test(value)) {
    return "Source line unavailable";
  }

  if (/[A-Za-z]-$/.test(value)) {
    return "Source line unavailable";
  }

  if (/\s[a-zA-Z]{1,2}$/.test(value)) {
    return "Source line unavailable";
  }

  return value;
}

const ITEM_RULES = [
  "PR_ITEM_UNMATCHED",
  "PR_MATCH_AMBIGUOUS",
  "UNIT_MISMATCH_REVIEW",
  "NO_QUOTED_ITEM_MATCHED_REVIEW",
];

const QUANTITY_RULES = [
  "QUANTITY_VARIANCE_GREATER_THAN_5_REVIEW",
  "QUANTITY_NOT_EVALUABLE_REVIEW",
];

const PRICE_RULES = [
  "PRICE_ABOVE_3_PERCENT_REJECT",
  "PRICE_ABOVE_MAX_REVIEW_BAND",
  "PRICE_NOT_EVALUABLE_REVIEW",
  "QUOTED_CURRENCY_REVIEW",
];

const DELIVERY_RULES = [
  "DELIVERY_LATER_THAN_45_DAYS_REJECT",
  "DELIVERY_31_TO_45_DAYS_REVIEW",
  "DELIVERY_DAYS_UNCLEAR_REVIEW",
  "DELIVERY_DAYS_UNPARSED_REVIEW",
];

const PAYMENT_RULES = [
  "PAYMENT_DAYS_UNCLEAR_REVIEW",
  "PAYMENT_DAYS_UNPARSED_REVIEW",
  "PAYMENT_DAYS_OUTSIDE_RANGE_REVIEW",
  "ADVANCE_PAYMENT_ABOVE_LIMIT_REJECT",
  "ADVANCE_PAYMENT_UNCLEAR_REVIEW",
];

const PENALTY_RULES = [
  "LATE_PENALTY_MISSING_REJECT",
  "LATE_PENALTY_UNCLEAR_REVIEW",
  "LATE_PENALTY_RATE_UNCLEAR_REVIEW",
  "LATE_PENALTY_RATE_BELOW_MINIMUM_REVIEW",
];

export interface ComparisonRow {
  label: string;
  purchaseRequest: string;
  supplierQuotation: string;
  note: string | null;
  tone: RowTone;
}

function toneForRules(
  findings: VerificationFindingResponse[],
  ruleIds: string[],
  quotedItemCode?: string | null
): RowTone {
  const relevant = findings.filter((finding) => {
    if (!ruleIds.includes(finding.rule_id)) {
      return false;
    }

    if (quotedItemCode === undefined) {
      return true;
    }

    return (
      finding.related_quoted_item_code === null ||
      finding.related_quoted_item_code === quotedItemCode
    );
  });

  if (relevant.some((finding) => finding.severity === "REJECT")) {
    return "reject";
  }

  if (relevant.some((finding) => finding.severity === "REVIEW")) {
    return "review";
  }

  return "pass";
}

function itemRows(
  match: MatchResultResponse,
  findings: VerificationFindingResponse[]
): ComparisonRow[] {
  const currency = match.quoted_currency;
  const itemCode = match.quoted_item_code;

  return [
    {
      label: "Item",
      purchaseRequest: match.matched_pr_description ?? "—",
      supplierQuotation: match.quoted_description ?? "—",
      note: null,
      tone: toneForRules(findings, ITEM_RULES, itemCode),
    },
    {
      label: "Quantity",
      purchaseRequest: formatQuantity(match.requested_quantity, match.matched_pr_unit),
      supplierQuotation: formatQuantity(match.quoted_quantity, match.quoted_unit),
      note:
        match.quantity_variance_percent === null
          ? null
          : `${formatPercentValue(match.quantity_variance_percent)} variance`,
      tone: toneForRules(findings, QUANTITY_RULES, itemCode),
    },
    {
      label: "Unit price",
      purchaseRequest: formatMoney(match.maximum_unit_price, currency),
      supplierQuotation: formatMoney(match.quoted_unit_price, currency),
      note:
        match.price_variance_percent === null
          ? null
          : `${formatPercentValue(match.price_variance_percent)} variance`,
      tone: toneForRules(findings, PRICE_RULES, itemCode),
    },
  ];
}

export function buildComparisonRows(
  verification: VerificationResultResponse,
  extraction: ExtractedQuotationResponse,
  thresholds: RuleThresholds
): ComparisonRow[] {
  const rows: ComparisonRow[] = [];

  for (const match of verification.match_results) {
    rows.push(...itemRows(match, verification.findings));
  }

  const deliveryDays = extractedFieldValue(extraction.delivery_days);
  const paymentTerms = extractedFieldValue(extraction.payment_terms);
  const penaltyRate = extractedFieldValue(
    extraction.late_penalty_rate_per_week_percent
  );

  rows.push({
    label: "Delivery",
    purchaseRequest: thresholds.deliveryDays
      ? `Within ${thresholds.deliveryDays} days`
      : "Rule threshold unavailable",
    supplierQuotation: deliveryDays.missing
      ? deliveryDays.text
      : `${deliveryDays.text} days`,
    note: null,
    tone: toneForRules(verification.findings, DELIVERY_RULES),
  });

  rows.push({
    label: "Payment terms",
    purchaseRequest: "Not in purchase request",
    supplierQuotation: paymentTerms.text,
    note: null,
    tone: toneForRules(verification.findings, PAYMENT_RULES),
  });

  rows.push({
    label: "Late penalty",
    purchaseRequest: thresholds.penaltyRatePerWeekPercent
      ? `Min ${thresholds.penaltyRatePerWeekPercent}% per week`
      : "Rule threshold unavailable",
    supplierQuotation: penaltyRate.missing
      ? penaltyRate.text
      : `${formatPercentValue(penaltyRate.text)} per week`,
    note: null,
    tone: toneForRules(verification.findings, PENALTY_RULES),
  });

  return rows;
}

export function sortFindings(
  findings: VerificationFindingResponse[]
): VerificationFindingResponse[] {
  const rank: Record<VerificationFindingResponse["severity"], number> = {
    REJECT: 0,
    REVIEW: 1,
    INFO: 2,
  };

  return [...findings].sort((left, right) => rank[left.severity] - rank[right.severity]);
}
