"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { getBatch } from "@/lib/api";
import type { BatchUploadResult } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes } from "@/lib/purchase-requests";

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
          {new Date(batch.created_at).toLocaleString()} ·{" "}
          {batch.purchase_request_id ?? "No purchase request"} ·{" "}
          {batch.documents.length} document(s)
        </p>
      </header>

      {batch.documents.length > 1 && (
        <div className="flex gap-2">
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
          <CardTitle className="text-lg font-semibold text-foreground">
            Source document
          </CardTitle>
          <CardDescription>
            {document.original_filename} · {formatBytes(document.size_bytes)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <iframe
            title="Source PDF"
            src={`${API_BASE_URL}/api/batches/${batch.batch_id}/documents/${document.document_id}/file`}
            className="h-[560px] w-full rounded-md border border-border"
          />
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Verification outcome
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge
            className={
              document.verification_result.decision.decision === "REJECT"
                ? "bg-danger/10 text-danger"
                : document.verification_result.decision.decision === "NEEDS_HUMAN_REVIEW"
                  ? "bg-warning/10 text-warning"
                  : "bg-success/10 text-success"
            }
          >
            {document.verification_result.decision.decision}
          </Badge>
          <p className="mt-3 text-sm text-foreground">
            {document.verification_result.decision.decision_summary}
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Findings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {document.verification_result.findings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No findings were triggered.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3">Rule</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Observed</th>
                    <th className="px-4 py-3">Expected</th>
                    <th className="px-4 py-3">Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {document.verification_result.findings.map((finding) => (
                    <tr key={finding.finding_id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3 text-foreground">{finding.title}</td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            finding.severity === "REJECT"
                              ? "bg-danger/10 text-danger"
                              : finding.severity === "REVIEW"
                                ? "bg-warning/10 text-warning"
                                : "bg-muted text-muted-foreground"
                          }
                        >
                          {finding.severity}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {String(finding.observed_value ?? "—")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {String(finding.expected_value ?? "—")}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {finding.evidence_text
                          ? `p. ${finding.page_number}: ${finding.evidence_text}`
                          : "Not available"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
