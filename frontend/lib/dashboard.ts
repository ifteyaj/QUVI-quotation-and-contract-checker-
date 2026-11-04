import type {
  BatchUploadResult,
  ExtractedFieldResponse,
  UploadedDocumentResult,
} from "@/lib/api";

export interface DashboardDocument {
  batchId: string;
  document: UploadedDocumentResult;
}

export type Decision = "APPROVE" | "REJECT" | "NEEDS_HUMAN_REVIEW";

const decisionStyles: Record<
  Decision,
  { label: string; dotClassName: string; pillClassName: string }
> = {
  APPROVE: {
    label: "Passed checks",
    dotClassName: "bg-success",
    pillClassName: "bg-success/10 text-success",
  },
  REJECT: {
    label: "Rejected",
    dotClassName: "bg-danger",
    pillClassName: "bg-danger/10 text-danger",
  },
  NEEDS_HUMAN_REVIEW: {
    label: "Needs review",
    dotClassName: "bg-warning",
    pillClassName: "bg-warning/10 text-warning",
  },
};

export function getDecision(document: UploadedDocumentResult): Decision {
  return document.verification_result.decision.decision;
}

export function getDecisionStyle(decision: Decision) {
  return decisionStyles[decision];
}

export function getDecisionAriaLabel(document: UploadedDocumentResult): string {
  const decision = getDecision(document);
  const result = document.verification_result;

  if (decision === "APPROVE") {
    return "Passed automated checks. Final approval rests with a person.";
  }

  if (decision === "REJECT") {
    const count = result.decision.confirmed_reject_count;
    return `Rejected: ${count} issue${count === 1 ? "" : "s"} found`;
  }

  return "Needs a person to check";
}

export function fieldLabel(field: ExtractedFieldResponse<string>): string {
  if (
    field.status !== "EXTRACTED" ||
    field.value === null ||
    field.value === undefined ||
    field.value === ""
  ) {
    return "Not extracted";
  }

  return field.value;
}

export function fieldSearchValue(field: ExtractedFieldResponse<string>): string {
  if (
    field.status !== "EXTRACTED" ||
    field.value === null ||
    field.value === undefined
  ) {
    return "";
  }

  return field.value;
}

export function formatSubmittedDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function flattenAndSortDocuments(
  batches: BatchUploadResult[]
): DashboardDocument[] {
  return batches
    .flatMap((batch) =>
      batch.documents.map((document) => ({
        batchId: batch.batch_id,
        document,
      }))
    )
    .sort(
      (left, right) =>
        new Date(right.document.created_at).getTime() -
        new Date(left.document.created_at).getTime()
    );
}

export function firstFindingTitle(document: UploadedDocumentResult): string {
  const findings = document.verification_result.findings;

  if (findings.length === 0) {
    return document.verification_result.decision.decision_summary;
  }

  const severityRank = { REJECT: 0, REVIEW: 1, INFO: 2 } as const;

  return [...findings].sort(
    (left, right) => severityRank[left.severity] - severityRank[right.severity]
  )[0].title;
}
