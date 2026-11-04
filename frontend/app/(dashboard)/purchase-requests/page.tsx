"use client";

import { useEffect, useState } from "react";
import { listPurchaseRequests, getPurchaseRequest } from "@/lib/api";
import type { PurchaseRequestResponse } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PurchaseRequestsPage() {
  const [availableRequests, setAvailableRequests] = useState<Array<{ pr_number: string; title: string; item_count: number }>>([]);
  const [selectedPr, setSelectedPr] = useState("PR-2026-114");
  const [purchaseRequest, setPurchaseRequest] = useState<PurchaseRequestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([listPurchaseRequests(), getPurchaseRequest("PR-2026-114")])
      .then(([requests, pr]) => {
        if (!active) return;
        setAvailableRequests(requests);
        setSelectedPr(pr.pr_number);
        setPurchaseRequest(pr);
      })
      .catch((fetchError) => {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "Purchase requests could not be loaded.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getPurchaseRequest(selectedPr)
      .then((pr) => {
        if (active) setPurchaseRequest(pr);
      })
      .catch((fetchError) => {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "Purchase request could not be loaded.");
        }
      });
    return () => {
      active = false;
    };
  }, [selectedPr]);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Purchase Requests
        </h1>
        <p className="text-sm text-muted-foreground">
          Read-only supplied purchase request data used for quotation matching.
        </p>
      </header>

      {error ? (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Loading purchase requests...</p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Request</span>
            <Select value={selectedPr} onValueChange={setSelectedPr}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Select a purchase request" />
              </SelectTrigger>
              <SelectContent>
                {availableRequests.map((request) => (
                  <SelectItem key={request.pr_number} value={request.pr_number}>
                    {request.pr_number} ({request.item_count} items)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Card className="rounded-xl border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                {purchaseRequest?.title ?? selectedPr}
              </CardTitle>
              <CardDescription>
                Maximum unit prices and requested quantities from the supplied CSV.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3 text-right">Requested quantity</th>
                      <th className="px-4 py-3 text-right">Maximum price (BDT)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseRequest?.items.map((item) => (
                      <tr key={item.item_code} className="border-b border-border last:border-b-0">
                        <td className="px-4 py-3 font-medium text-foreground">{item.item_code}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.description}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.unit}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {Number(item.requested_quantity).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {Number(item.maximum_unit_price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
