"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, FileText } from "lucide-react";
import { listBatches } from "@/lib/api";
import type { BatchUploadResult } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes } from "@/lib/purchase-requests";

const statusFilters = {
  approve: { label: "Approved", decision: "APPROVE" },
  reject: { label: "Rejected", decision: "REJECT" },
  review: { label: "Needs review", decision: "NEEDS_HUMAN_REVIEW" },
} as const;

type StatusFilterKey = keyof typeof statusFilters;

function isStatusFilter(value: string | null): value is StatusFilterKey {
  return value !== null && value in statusFilters;
}

export default function VerificationsPage() {
  return (
    <Suspense
      fallback={<p className="p-8 text-sm text-muted-foreground">Loading verifications...</p>}
    >
      <VerificationsContent />
    </Suspense>
  );
}

function VerificationsContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const statusFilter = isStatusFilter(statusParam) ? statusParam : null;
  const filter = statusFilter ? statusFilters[statusFilter] : null;

  const [batches, setBatches] = useState<BatchUploadResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    listBatches()
      .then((result) => {
        if (active) setBatches(result);
      })
      .catch((fetchError) => {
        if (active) setError(fetchError instanceof Error ? fetchError.message : "Verifications could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleBatches = filter
    ? batches
        .map((batch) => ({
          ...batch,
          documents: batch.documents.filter(
            (document) => document.verification_result.decision.decision === filter.decision
          ),
        }))
        .filter((batch) => batch.documents.length > 0)
    : batches;

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Verifications
          </h1>
          <p className="text-sm text-muted-foreground">
            Verification records are retained in the current server session.
          </p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/verifications/new">
            New Verification <ArrowRight className="size-4" />
          </Link>
        </Button>
      </header>

      {filter ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center rounded-full bg-primary-light px-3 py-1 font-medium text-primary">
            Showing: {filter.label}
          </span>
          <Link
            href="/verifications"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Clear filter
          </Link>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Loading verifications...</p>
      ) : batches.length === 0 ? (
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="py-8 text-center">
            <FileText className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              No verification records available
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Verification records are created when a user submits a supplier PDF.
              They are not persisted after the backend process restarts.
            </p>
            <Button asChild className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/verifications/new">Start a verification</Link>
            </Button>
          </CardContent>
        </Card>
      ) : visibleBatches.length === 0 ? (
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="py-8 text-center">
            <FileText className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              No documents match this filter
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Clear the filter to see every verification in this session.
            </p>
            <Button asChild className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/verifications">Clear filter</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleBatches.map((batch) => (
            <Card key={batch.batch_id} className="rounded-xl border-border shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    {batch.batch_id}
                  </CardTitle>
                  <CardDescription>
                    {new Date(batch.created_at).toLocaleString()} ·{" "}
                    {batch.documents.length} document(s)
                    {batch.purchase_request_id ? ` · ${batch.purchase_request_id}` : ""}
                  </CardDescription>
                </div>
                <Link
                  href={`/verifications/${batch.batch_id}`}
                  className="text-sm font-medium text-primary hover:text-primary/80"
                >
                  Open
                </Link>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                        <th className="px-4 py-3">Document</th>
                        <th className="px-4 py-3">Processing</th>
                        <th className="px-4 py-3">Decision</th>
                        <th className="px-4 py-3 text-right">Size</th>
                        <th className="px-4 py-3">SHA-256</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batch.documents.map((document) => (
                        <tr key={document.document_id} className="border-b border-border last:border-b-0">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {document.original_filename}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {document.processing_status}
                          </td>
                          <td className="px-4 py-3">
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
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {formatBytes(document.size_bytes)}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {document.sha256.slice(0, 16)}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
