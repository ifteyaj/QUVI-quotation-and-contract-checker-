"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { listBatches } from "@/lib/api";
import type { BatchUploadResult } from "@/lib/api";
import {
  fieldSearchValue,
  flattenAndSortDocuments,
  getDecision,
} from "@/lib/dashboard";
import { NeedsAttention } from "@/components/dashboard/needs-attention";
import { OverviewHero } from "@/components/dashboard/overview-hero";
import { OverviewSkeleton } from "@/components/dashboard/overview-skeleton";
import { RecentQuotations } from "@/components/dashboard/recent-quotations";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { Button } from "@/components/ui/button";

export default function OverviewPage() {
  const [batches, setBatches] = useState<BatchUploadResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    listBatches()
      .then((result) => {
        if (active) {
          setBatches(result);
        }
      })
      .catch((fetchError) => {
        if (active) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "The overview could not be loaded."
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
  }, [reloadKey]);

  const documents = useMemo(() => flattenAndSortDocuments(batches), [batches]);

  const counts = useMemo(() => {
    return documents.reduce(
      (totals, row) => {
        const decision = getDecision(row.document);

        if (decision === "APPROVE") {
          totals.approved += 1;
        } else if (decision === "REJECT") {
          totals.rejected += 1;
        } else {
          totals.needsReview += 1;
        }

        return totals;
      },
      { approved: 0, rejected: 0, needsReview: 0 }
    );
  }, [documents]);

  const recentRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return documents.slice(0, 5);
    }

    return documents
      .filter((row) => {
        const supplier = fieldSearchValue(
          row.document.quotation_extraction.supplier_name
        );
        const quotationNumber = fieldSearchValue(
          row.document.quotation_extraction.quotation_number
        );

        return (
          supplier.toLowerCase().includes(query) ||
          quotationNumber.toLowerCase().includes(query)
        );
      })
      .slice(0, 5);
  }, [documents, searchQuery]);

  const attentionRows = useMemo(() => {
    return documents
      .filter((row) => {
        const decision = getDecision(row.document);
        return decision === "REJECT" || decision === "NEEDS_HUMAN_REVIEW";
      })
      .slice(0, 3);
  }, [documents]);

  return (
    <section className="flex min-h-screen w-full flex-col gap-5 overflow-x-hidden overflow-y-auto px-6 py-5 xl:h-screen xl:overflow-hidden">
      <header className="flex h-16 shrink-0 items-center gap-4 md:justify-between">
        <h1 className="text-[22px] font-semibold leading-7 tracking-tight text-foreground">
          Overview
        </h1>

        <div className="relative w-full md:w-[340px]">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search quotations, suppliers..."
            aria-label="Search quotations and suppliers"
            className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </header>

      <OverviewHero />

      {loading ? (
        <OverviewSkeleton />
      ) : error ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6">
          <p className="text-sm font-medium text-danger">
            The overview could not be loaded.
          </p>
          <p className="mt-1 text-sm text-danger/80">{error}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-4 h-10 border-danger/30 px-4 text-sm text-danger hover:bg-danger/10 hover:text-danger"
          >
            Try again
          </Button>
        </div>
      ) : (
        <>
          <SummaryCards
            total={documents.length}
            approved={counts.approved}
            rejected={counts.rejected}
            needsReview={counts.needsReview}
          />

          <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[1.85fr_1fr]">
            <RecentQuotations
              rows={recentRows}
              totalDocuments={documents.length}
              onClearSearch={() => setSearchQuery("")}
            />
            <NeedsAttention rows={attentionRows} />
          </div>
        </>
      )}
    </section>
  );
}
