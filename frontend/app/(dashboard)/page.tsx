"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { getPurchaseRequest, listBatches } from "@/lib/api";
import type { BatchUploadResult } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
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
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "Verifications could not be loaded.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const documents = batches.flatMap((batch) => batch.documents);
  const decisionCounts = {
    approve: documents.filter((doc) => doc.verification_result.decision.decision === "APPROVE").length,
    review: documents.filter(
      (doc) => doc.verification_result.decision.decision === "NEEDS_HUMAN_REVIEW"
    ).length,
    rejected: documents.filter((doc) => doc.verification_result.decision.decision === "REJECT").length,
  };

  return (
    <section className="mx-auto w-full max-w-6xl space-y-8 p-6 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            QUVI Dashboard
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Supplier quotation and contract verification. Upload a PDF to extract
            quotation information, match it against a purchase request, apply fixed
            company rules, and review evidence-backed findings.
          </p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/verifications/new">
            New Verification <ArrowRight className="size-4" />
          </Link>
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Purchase Request PR-2026-114
            </CardTitle>
            <CardDescription>
              Real supplied request data used for quotation comparison.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PurchaseRequestSummary />
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Recent Verifications
            </CardTitle>
            <CardDescription>
              Verification records are retained in the current server session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading records...</p>
            ) : error ? (
              <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            ) : batches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No verification records yet. Start with New Verification.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  {batches.slice(0, 5).map((batch) =>
                    batch.documents.map((document) => (
                      <Link
                        key={document.document_id}
                        href={`/verifications/${batch.batch_id}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {document.original_filename}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {batch.batch_id} · {new Date(batch.created_at).toLocaleString()}
                          </p>
                        </div>
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
                      </Link>
                    ))
                  )}
                </div>
                {(decisionCounts.approve > 0 ||
                  decisionCounts.review > 0 ||
                  decisionCounts.rejected > 0) && (
                  <p className="text-xs text-muted-foreground">
                    Current session: {documents.length} document(s),{" "}
                    {decisionCounts.approve} approve, {decisionCounts.review} review,{" "}
                    {decisionCounts.rejected} reject.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Decision meanings
          </CardTitle>
          <CardDescription>
            The final decision is produced by deterministic backend rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Badge className="bg-success/10 text-success">APPROVE</Badge>
            <p className="text-sm text-muted-foreground">
              All applicable checks passed.
            </p>
          </div>
          <div className="space-y-1">
            <Badge className="bg-danger/10 text-danger">REJECT</Badge>
            <p className="text-sm text-muted-foreground">
              A confirmed reject condition applied.
            </p>
          </div>
          <div className="space-y-1">
            <Badge className="bg-warning/10 text-warning">NEEDS_HUMAN_REVIEW</Badge>
            <p className="text-sm text-muted-foreground">
              Uncertainty, ambiguity, or a review condition remained.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function PurchaseRequestSummary() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getPurchaseRequest>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPurchaseRequest("PR-2026-114")
      .then((result) => {
        if (active) setData(result);
      })
      .catch((fetchError) => {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "Purchase request could not be loaded.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>;
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Loading purchase request...</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="px-4 py-2">Item</th>
            <th className="px-4 py-2">Description</th>
            <th className="px-4 py-2">Unit</th>
            <th className="px-4 py-2 text-right">Quantity</th>
            <th className="px-4 py-2 text-right">Max price</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => (
            <tr key={item.item_code} className="border-b border-border last:border-b-0">
              <td className="px-4 py-2 font-medium text-foreground">{item.item_code}</td>
              <td className="px-4 py-2 text-muted-foreground">{item.description}</td>
              <td className="px-4 py-2 text-muted-foreground">{item.unit}</td>
              <td className="px-4 py-2 text-right text-muted-foreground">
                {Number(item.requested_quantity).toLocaleString()}
              </td>
              <td className="px-4 py-2 text-right text-muted-foreground">
                {Number(item.maximum_unit_price).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
