"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  FileText,
  Hash,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";

import { API_BASE_URL, getBatch, getPolicyRules } from "@/lib/api";
import type { BatchUploadResult, PolicyRuleGroupResponse } from "@/lib/api";
import {
  buildComparisonRows,
  evidenceLine,
  extractedFieldValue,
  formatCheckedOn,
  parseRuleThresholds,
  sortFindings,
  type Outcome,
  type RowTone,
} from "@/lib/verification-result";
import { cn } from "@/lib/utils";

const outcomeStyles: Record<
  Outcome,
  {
    pillLabel: string;
    heroIcon: typeof Check;
    heroIconClassName: string;
    heroIconSurfaceClassName: string;
    pillClassName: string;
    dotClassName: string;
    panelClassName: string;
  }
> = {
  APPROVE: {
    pillLabel: "Checks passed",
    heroIcon: Check,
    heroIconClassName: "text-success",
    heroIconSurfaceClassName: "bg-success/15",
    pillClassName: "bg-success/10 text-success",
    dotClassName: "bg-success",
    panelClassName: "border-success/25 bg-success/5",
  },
  REJECT: {
    pillLabel: "Rejected",
    heroIcon: X,
    heroIconClassName: "text-danger",
    heroIconSurfaceClassName: "bg-danger/15",
    pillClassName: "bg-danger/10 text-danger",
    dotClassName: "bg-danger",
    panelClassName: "border-danger/25 bg-danger/5",
  },
  NEEDS_HUMAN_REVIEW: {
    pillLabel: "Needs review",
    heroIcon: TriangleAlert,
    heroIconClassName: "text-warning",
    heroIconSurfaceClassName: "bg-warning/15",
    pillClassName: "bg-warning/10 text-warning",
    dotClassName: "bg-warning",
    panelClassName: "border-warning/25 bg-warning/5",
  },
};

const toneStyles: Record<
  RowTone,
  { label: string; surfaceClassName: string; icon: typeof Check }
> = {
  pass: { label: "Pass", surfaceClassName: "bg-success", icon: Check },
  review: { label: "Review", surfaceClassName: "bg-warning", icon: TriangleAlert },
  reject: { label: "Reject", surfaceClassName: "bg-danger", icon: X },
};

function ResultMark({ tone }: { tone: RowTone }) {
  const style = toneStyles[tone];
  const Icon = style.icon;

  return (
    <span className="inline-flex items-center justify-center">
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full text-white",
          style.surfaceClassName
        )}
        aria-hidden="true"
      >
        <Icon className="size-3" />
      </span>
      <span className="sr-only">{style.label}</span>
    </span>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
  warning,
  title,
  className,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  warning?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium text-muted-foreground">{label}</p>
        <p
          title={title}
          className={cn(
            "truncate text-[13px] font-semibold",
            warning ? "text-warning" : "text-foreground"
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function VerificationResultView({ batchId }: { batchId: string }) {
  const [batch, setBatch] = useState<BatchUploadResult | null>(null);
  const [rules, setRules] = useState<PolicyRuleGroupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    Promise.all([getBatch(batchId), getPolicyRules().catch(() => null)])
      .then(([result, policy]) => {
        if (active) {
          setBatch(result);
          setRules(policy);
        }
      })
      .catch((fetchError) => {
        if (active) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "This verification could not be loaded."
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [batchId]);

  if (loading) {
    return (
      <section className="flex min-h-screen w-full flex-col gap-5 overflow-x-hidden overflow-y-auto px-6 py-5 xl:h-screen xl:overflow-hidden">
        <p className="text-sm text-muted-foreground" role="status">
          Loading verification...
        </p>
      </section>
    );
  }

  if (error || !batch) {
    return (
      <section className="flex min-h-screen w-full flex-col gap-5 overflow-x-hidden overflow-y-auto px-6 py-5 xl:h-screen xl:overflow-hidden">
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6">
          <p className="text-sm font-medium text-danger">
            This verification could not be loaded.
          </p>
          <p className="mt-1 text-sm text-danger/80">
            {error ?? "The batch does not exist in the current server session."}
          </p>
          <Link
            href="/verifications"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
            Back to Verification List
          </Link>
        </div>
      </section>
    );
  }

  const document = batch.documents[0];

  if (!document) {
    return (
      <section className="flex min-h-screen w-full flex-col gap-5 overflow-x-hidden overflow-y-auto px-6 py-5 xl:h-screen xl:overflow-hidden">
        <Link
          href="/verifications"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Verification List
        </Link>
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-6">
          <p className="text-sm font-medium text-warning">
            This batch has no accepted documents.
          </p>
          {batch.rejected_files.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {batch.rejected_files.map((rejected) => (
                <li key={rejected.filename}>
                  {rejected.filename}: {rejected.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    );
  }

  const extraction = document.quotation_extraction;
  const verification = document.verification_result;
  const decision = verification.decision.decision;
  const style = outcomeStyles[decision];
  const HeroIcon = style.heroIcon;

  const rejectCount = verification.findings.filter(
    (finding) => finding.severity === "REJECT"
  ).length;

  const heroTitle =
    decision === "APPROVE"
      ? "Checks passed"
      : decision === "REJECT"
        ? `Rejected: ${rejectCount} issue${rejectCount === 1 ? "" : "s"} found`
        : "Needs a person to check";

  const heroSubline =
    decision === "APPROVE"
      ? "Final approval rests with a person."
      : verification.decision.decision_summary;

  const quotationNumber = extractedFieldValue(extraction.quotation_number);
  const supplierName = extractedFieldValue(extraction.supplier_name);
  const supplierTin = extractedFieldValue(extraction.supplier_tin);
  const supplierBin = extractedFieldValue(extraction.supplier_bin);

  const thresholds = parseRuleThresholds(rules);
  const rows = buildComparisonRows(verification, extraction, thresholds);
  const findings = sortFindings(verification.findings);

  const bottomText =
    decision === "APPROVE"
      ? "No issues were found in this verification."
      : "Review the findings above before deciding.";

  const sourcePdfUrl = `${API_BASE_URL}/api/batches/${batch.batch_id}/documents/${document.document_id}/file`;

  return (
    <section className="flex min-h-screen w-full flex-col gap-5 overflow-x-hidden overflow-y-auto px-6 py-5 xl:h-screen xl:overflow-hidden">
      <header className="flex h-16 shrink-0 items-center justify-between gap-4">
        <Link
          href="/verifications"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Verification List
        </Link>
      </header>

      <div className="flex h-[120px] shrink-0 items-center gap-6">
        <div
          className={cn(
            "flex size-16 shrink-0 items-center justify-center rounded-full sm:size-20",
            style.heroIconSurfaceClassName
          )}
        >
          <HeroIcon className={cn("size-5 sm:size-6", style.heroIconClassName)} />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
            {heroTitle}
          </h1>
          <p className="mt-1 text-[14px] text-muted-foreground">{heroSubline}</p>
        </div>

        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-medium sm:self-center",
            style.pillClassName
          )}
        >
          <span
            aria-hidden="true"
            className={cn("size-2 rounded-full", style.dotClassName)}
          />
          {style.pillLabel}
        </span>
      </div>

      <div className="flex h-16 shrink-0 items-center divide-x divide-border rounded-2xl border border-border bg-card px-4">
        <MetaItem
          icon={FileText}
          label="Quotation"
          value={quotationNumber.text}
          warning={quotationNumber.missing}
          className="flex-1 min-w-0 px-2"
        />
        <MetaItem
          icon={CalendarDays}
          label="Checked on"
          value={formatCheckedOn(document.created_at)}
          className="flex-1 min-w-0 px-2"
        />
        <MetaItem
          icon={Building2}
          label="Supplier"
          value={supplierName.text}
          warning={supplierName.missing}
          title={supplierName.missing ? undefined : supplierName.text}
          className="flex-1 min-w-0 px-2"
        />
        <MetaItem
          icon={Hash}
          label="Supplier TIN"
          value={supplierTin.text}
          warning={supplierTin.missing}
          className="flex-1 min-w-0 px-2"
        />
        <MetaItem
          icon={Hash}
          label="Supplier BIN"
          value={supplierBin.text}
          warning={supplierBin.missing}
          className="flex-1 min-w-0 px-2"
        />
      </div>

      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div className="flex min-h-[320px] lg:h-full min-w-0 flex-col overflow-hidden overflow-hidden rounded-2xl border border-border bg-card p-5">
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground">
            Comparison Overview
          </h2>

          <div className="mt-2 max-h-80 w-full min-w-0 max-w-full flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full min-w-[520px] text-[14px]">
              <thead>
                <tr className="h-auto lg:h-11 bg-muted/60 text-left text-[11px] font-medium text-muted-foreground">
                  <th className="rounded-l-lg px-4 py-2 font-medium">Check</th>
                  <th className="px-4 py-2 font-medium">Purchase Request</th>
                  <th className="px-4 py-2 font-medium">Supplier Quotation</th>
                  <th className="rounded-r-lg px-4 py-2 text-right font-medium">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={`${row.label}-${index}`}
                    className="h-auto lg:h-11 border-b border-border/70 last:border-b-0"
                  >
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {row.label}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {row.purchaseRequest}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      <span className="text-foreground">{row.supplierQuotation}</span>
                      {row.note && (
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          {row.note}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <ResultMark tone={row.tone} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div
          className={cn(
            "flex min-h-[320px] lg:h-full min-w-0 flex-col overflow-hidden overflow-hidden rounded-2xl border p-5",
            style.panelClassName
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full",
                style.heroIconSurfaceClassName
              )}
            >
              <HeroIcon className={cn("size-4", style.heroIconClassName)} />
            </div>
            <h2 className="text-[16px] font-semibold tracking-tight text-foreground">
              Key Findings
            </h2>
          </div>

          {findings.length === 0 ? (
            <p className="mt-3 text-[14px] text-muted-foreground">
              No findings were triggered. This does not by itself approve a
              quotation.
            </p>
          ) : (
            <ul className="mt-2 max-h-80 w-full min-w-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {findings.map((finding) => {
                const findingTone: RowTone =
                  finding.severity === "REJECT"
                    ? "reject"
                    : finding.severity === "REVIEW"
                      ? "review"
                      : "pass";

                return (
                  <li key={finding.finding_id} className="flex items-start gap-3">
                    <span className="mt-0.5">
                      <ResultMark tone={findingTone} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-foreground">
                        {finding.title}
                      </p>
                      <p className="mt-1 text-[14px] text-muted-foreground">
                        {finding.message}
                      </p>
                      {finding.page_number !== null && (
                        <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                          Page {finding.page_number}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {evidenceLine(finding.evidence_text)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="flex h-14 shrink-0 items-center justify-between gap-3 rounded-2xl border border-border bg-primary-light/60 px-5 py-3 sm:flex-row">
        <div className="flex items-center gap-3 text-[14px] text-foreground">
          <Info className="size-4 shrink-0 text-primary" />
          <span>{bottomText}</span>
        </div>

        <a
          href={sourcePdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 text-[14px] font-medium text-foreground transition-colors hover:bg-muted"
        >
          View Source PDF
          <ArrowRight className="size-4" />
        </a>
      </div>
    </section>
  );
}
