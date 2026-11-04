"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { getBatch } from "@/lib/api";
import type { BatchUploadResult, UploadedDocumentResult } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes } from "@/lib/purchase-requests";

function DecisionBadge({ decision }: { decision: UploadedDocumentResult["verification_result"]["decision"]["decision"] }) {
  const className =
    decision === "REJECT"
      ? "bg-danger/10 text-danger"
      : decision === "NEEDS_HUMAN_REVIEW"
        ? "bg-warning/10 text-warning"
        : "bg-success/10 text-success";

  return <Badge className={className}>{decision}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "EXTRACTED"
      ? "bg-success/10 text-success"
      : status === "UNCLEAR"
        ? "bg-warning/10 text-warning"
        : "bg-muted text-muted-foreground";

  return <Badge className={className}>{status}</Badge>;
}

function DisplayField({
  label,
  field,
}: {
  label: string;
  field?: UploadedDocumentResult["quotation_extraction"][keyof UploadedDocumentResult["quotation_extraction"]];
}) {
  if (!field || typeof field !== "object" || !("status" in field)) {
    return (
      <div className="space-y-1">
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className="text-sm text-muted-foreground">—</dd>
      </div>
    );
  }

  const typedField = field as {
    status: string;
    value: unknown;
    evidence: Array<{ page_number: number; snippet: string }>;
  };

  const value =
    typedField.value === null || typedField.value === undefined || typedField.value === ""
      ? "—"
      : typeof typedField.value === "boolean"
        ? typedField.value
          ? "Yes"
          : "No"
        : String(typedField.value);

  return (
    <div className="space-y-1">
      <dt className="flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        <StatusBadge status={typedField.status} />
      </dt>
      <dd className="text-sm text-foreground">{value}</dd>
      {typedField.evidence.length > 0 && (
        <p className="text-xs text-muted-foreground">
          p. {typedField.evidence[0].page_number}: {typedField.evidence[0].snippet}
        </p>
      )}
    </div>
  );
}

export default function VerificationDetailView({ id }: { id: string }) {
  const [batch, setBatch] = useState<BatchUploadResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState(0);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getBatch(id)
      .then((result) => {
        if (active) setBatch(result);
      })
      .catch((fetchError) => {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "Verification could not be loaded.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <p className="p-8 text-sm text-muted-foreground">Loading verification...</p>;
  if (error) return <div className="m-8 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>;
  if (!batch) return <p className="p-8 text-sm text-muted-foreground">Verification not found.</p>;

  const document = batch.documents[selectedDocumentIndex] ?? batch.documents[0];
  const extraction = document.quotation_extraction;
  const verification = document.verification_result;
  const rejectFindings = verification.findings.filter((finding) => finding.severity === "REJECT");
  const reviewFindings = verification.findings.filter((finding) => finding.severity === "REVIEW");
  const uncertainFindings = verification.findings.filter((finding) => !finding.confirmed);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-8">
      <div>
        <Link
          href="/verifications"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to verifications
        </Link>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {batch.batch_id}
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Date(batch.created_at).toLocaleString()} · {batch.purchase_request_id ?? "No purchase request"} ·{" "}
          {batch.documents.length} document(s)
        </p>
      </header>

      {batch.documents.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {batch.documents.map((item, index) => (
            <Button
              key={item.document_id}
              variant={index === selectedDocumentIndex ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDocumentIndex(index)}
            >
              {item.original_filename}
            </Button>
          ))}
        </div>
      )}

      <Card className="rounded-xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Decision overview</CardTitle>
          <CardDescription>
           Processing status is separate from the final business decision.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <DecisionBadge decision={verification.decision.decision} />
            <span className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              Processing: {document.processing_status}
            </span>
            <span className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              Extraction: {document.quotation_extraction.extraction_method}
            </span>
            <span className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              OCR needed: {document.needs_ocr ? "Yes" : "No"}
            </span>
          </div>
          <p className="text-sm text-foreground">{verification.decision.decision_summary}</p>
          <p className="text-xs text-muted-foreground">
            Rule version: {verification.decision.rule_version} · Findings: {verification.decision.review_count} review,{" "}
            {verification.decision.confirmed_reject_count} reject.
            {uncertainFindings.length > 0 && ` Uncertain findings: ${uncertainFindings.length}.`}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Supplier information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <DisplayField label="Supplier" field={extraction.supplier_name} />
              <DisplayField label="TIN" field={extraction.supplier_tin} />
              <DisplayField label="BIN" field={extraction.supplier_bin} />
              <DisplayField label="Quotation number" field={extraction.quotation_number} />
              <DisplayField label="Quotation date" field={extraction.quotation_date} />
              <DisplayField label="Reference PR" field={extraction.reference_pr_number} />
              <DisplayField label="Currency" field={extraction.currency} />
              <DisplayField label="Payment terms" field={extraction.payment_terms} />
              <DisplayField label="Advance" field={extraction.advance_percent} />
              <DisplayField label="Payment days" field={extraction.payment_days_after_delivery} />
              <DisplayField label="Delivery period" field={extraction.delivery_period} />
              <DisplayField label="Delivery days" field={extraction.delivery_days} />
              <DisplayField label="VAT rate" field={extraction.vat_rate_percent} />
              <DisplayField label="VAT separately shown" field={extraction.vat_separately_shown} />
              <DisplayField label="Validity days" field={extraction.quotation_validity_days} />
              <DisplayField label="Late penalty clause" field={extraction.late_penalty_clause_present} />
              <DisplayField label="Penalty rate" field={extraction.late_penalty_rate_per_week_percent} />
            </dl>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Human review
            </CardTitle>
          </CardHeader>
          <CardContent>
            {verification.decision.decision !== "NEEDS_HUMAN_REVIEW" ? (
              <p className="text-sm text-muted-foreground">
                No human review is required by the policy engine. All applicable conditions are resolved.
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-foreground">
                  QUVI stopped because uncertain, missing, or review-qualified information remains. It did not guess.
                </p>
                {reviewFindings.length > 0 && (
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {reviewFindings.map((finding) => (
                      <li key={finding.finding_id} className="rounded-md border border-warning/30 bg-warning/10 p-3">
                        <span className="font-medium text-foreground">{finding.title}</span>
                        {!finding.confirmed && " (uncertain)"}
                        <br />
                        {finding.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Quotation line items
          </CardTitle>
          <CardDescription>
            Extracted line items and purchase-request matches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {extraction.quoted_items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quotation line items were extracted.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3">Quoted item</th>
                    <th className="px-4 py-3">Matched PR item</th>
                    <th className="px-4 py-3">Match status</th>
                    <th className="px-4 py-3 text-right">Quoted qty</th>
                    <th className="px-4 py-3 text-right">Requested qty</th>
                    <th className="px-4 py-3 text-right">Qty variance</th>
                    <th className="px-4 py-3 text-right">Max price</th>
                    <th className="px-4 py-3 text-right">Quoted price</th>
                    <th className="px-4 py-3 text-right">Price variance</th>
                    <th className="px-4 py-3">Line total</th>
                    <th className="px-4 py-3">Arithmetic</th>
                  </tr>
                </thead>
                <tbody>
                  {extraction.quoted_items.map((item, index) => {
                    const match = verification.match_results.find(
                      (result) => result.quoted_item_index === index
                    );

                    const quotedQuantity =
                      item.quoted_quantity && typeof item.quoted_quantity.value === "string"
                        ? item.quoted_quantity.value
                        : item.quoted_quantity?.value;

                    return (
                      <tr
                        key={index}
                        className={`border-b border-border last:border-b-0 ${
                          match?.match_status === "UNMATCHED"
                            ? "bg-danger/5"
                            : match?.match_status === "AMBIGUOUS"
                              ? "bg-warning/5"
                              : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-foreground">
                          <div className="font-medium">
                            {item.item_code?.value ?? `Line ${index + 1}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.description?.value ?? "(missing description)"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {match?.matched_pr_item_code ?? "—"}
                          {match?.matched_pr_description ? (
                            <div className="text-xs">{match.matched_pr_description}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              match?.match_status === "UNMATCHED"
                                ? "bg-danger/10 text-danger"
                                : match?.match_status === "AMBIGUOUS"
                                  ? "bg-warning/10 text-warning"
                                  : "bg-success/10 text-success"
                            }
                          >
                            {match?.match_status ?? "NOT EVALUATED"}
                          </Badge>
                          {match?.match_method && (
                            <p className="mt-1 text-xs text-muted-foreground">{match.match_method}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {quotedQuantity ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {match?.requested_quantity ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {match?.quantity_variance_percent ? `${match.quantity_variance_percent}%` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {match?.maximum_unit_price ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {item.quoted_unit_price?.value ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {match?.price_variance_percent ? `${match.price_variance_percent}%` : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.line_total?.value ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {match?.line_total_matches === true
                            ? "Matches"
                            : match?.line_total_matches === false
                              ? "Mismatch"
                              : "n/a"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Rule findings
          </CardTitle>
          <CardDescription>
            Each finding is deterministic and includes its evidence when available.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {verification.findings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No findings were triggered. This does not by itself approve a quotation.
            </p>
          ) : (
            <>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-danger">
                  Reject findings ({rejectFindings.length})
                </h3>
                {rejectFindings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None.</p>
                ) : (
                  <div className="space-y-3">
                    {rejectFindings.map((finding) => (
                      <div key={finding.finding_id} className="rounded-lg border border-danger/30 bg-danger/10 p-4">
                        <div className="mb-1 flex items-center gap-2">
                          <Badge className="bg-danger/10 text-danger">{finding.rule_id}</Badge>
                          {!finding.confirmed && (
                            <Badge className="bg-muted text-muted-foreground">uncertain</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground">{finding.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{finding.message}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Observed: {String(finding.observed_value ?? "—")} · Expected: {String(finding.expected_value ?? "—")}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {finding.evidence_text
                            ? `p. ${finding.page_number}: ${finding.evidence_text}`
                            : "No source evidence is available; treat this as requiring verification."}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-warning">
                  Review findings ({reviewFindings.length})
                </h3>
                {reviewFindings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None.</p>
                ) : (
                  <div className="space-y-3">
                    {reviewFindings.map((finding) => (
                      <div key={finding.finding_id} className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                        <div className="mb-1 flex items-center gap-2">
                          <Badge className="bg-warning/10 text-warning">{finding.rule_id}</Badge>
                          {!finding.confirmed && (
                            <Badge className="bg-muted text-muted-foreground">uncertain</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground">{finding.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{finding.message}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Observed: {String(finding.observed_value ?? "—")} · Expected: {String(finding.expected_value ?? "—")}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {finding.evidence_text
                            ? `p. ${finding.page_number}: ${finding.evidence_text}`
                            : "No source evidence is available; treat this as requiring verification."}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Source document
          </CardTitle>
          <CardDescription>
            {document.original_filename} · {formatBytes(document.size_bytes)} · Page {document.page_count}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <iframe
            title="Source PDF"
            src={`${API_BASE_URL}/api/batches/${batch.batch_id}/documents/${document.document_id}/file`}
            className="h-[520px] w-full rounded-md border border-border"
          />
          <details className="rounded-md border border-border p-4">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              Extracted text
            </summary>
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
              {document.extracted_text}
            </pre>
          </details>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Extracted quotation information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DisplayField label="Supplier name" field={extraction.supplier_name} />
            <DisplayField label="TIN" field={extraction.supplier_tin} />
            <DisplayField label="BIN" field={extraction.supplier_bin} />
            <DisplayField label="Quotation number" field={extraction.quotation_number} />
            <DisplayField label="Quotation date" field={extraction.quotation_date} />
            <DisplayField label="Purchase request reference" field={extraction.reference_pr_number} />
            <DisplayField label="Currency" field={extraction.currency} />
            <DisplayField label="Payment terms" field={extraction.payment_terms} />
            <DisplayField label="Advance payment" field={extraction.advance_percent} />
            <DisplayField label="Payment days" field={extraction.payment_days_after_delivery} />
            <DisplayField label="Delivery period" field={extraction.delivery_period} />
            <DisplayField label="Delivery days" field={extraction.delivery_days} />
            <DisplayField label="VAT rate" field={extraction.vat_rate_percent} />
            <DisplayField label="VAT separately shown" field={extraction.vat_separately_shown} />
            <DisplayField label="Validity days" field={extraction.quotation_validity_days} />
            <DisplayField label="Late penalty clause" field={extraction.late_penalty_clause_present} />
            <DisplayField label="Penalty rate" field={extraction.late_penalty_rate_per_week_percent} />
          </dl>
        </CardContent>
      </Card>
    </section>
  );
}
