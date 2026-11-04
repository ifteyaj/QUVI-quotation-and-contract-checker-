"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";

import { listBatches } from "@/lib/api";
import type { BatchUploadResult, UploadedDocumentResult } from "@/lib/api";
import { flattenAndSortDocuments, getDecision } from "@/lib/dashboard";
import { extractedFieldValue, formatCheckedOn } from "@/lib/verification-result";
import { Button } from "@/components/ui/button";

const ROWS_PER_PAGE = 10;

const STATUS_PARAM_TO_DECISION = {
  approve: "APPROVE",
  reject: "REJECT",
  review: "NEEDS_HUMAN_REVIEW",
} as const;

type StatusKey = keyof typeof STATUS_PARAM_TO_DECISION;

function isStatusKey(value: string | null): value is StatusKey {
  return value !== null && value in STATUS_PARAM_TO_DECISION;
}

type DocRow = {
  batchId: string;
  document: UploadedDocumentResult;
};

function decisionStyles(
  decision: UploadedDocumentResult["verification_result"]["decision"]["decision"]
): { label: string; dotClassName: string; pillClassName: string } {
  if (decision === "REJECT") {
    return { label: "Rejected", dotClassName: "bg-danger", pillClassName: "bg-danger/10 text-danger" };
  }
  if (decision === "NEEDS_HUMAN_REVIEW") {
    return {
      label: "Needs review",
      dotClassName: "bg-warning",
      pillClassName: "bg-warning/10 text-warning",
    };
  }
  return {
    label: "Checks passed",
    dotClassName: "bg-success",
    pillClassName: "bg-success/10 text-success",
  };
}

function SkeletonRows() {
  return (
    <tbody>
      {Array.from({ length: 10 }).map((_, index) => (
        <tr key={index} className="border-b border-border last:border-b-0">
          {Array.from({ length: 6 }).map((__, cell) => (
            <td key={cell} className="px-4 py-4">
              <div className="h-4 animate-pulse rounded bg-muted" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

function VerificationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusParam = searchParams.get("status");
  const statusFilter = isStatusKey(statusParam) ? statusParam : null;

  const [batches, setBatches] = useState<BatchUploadResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    listBatches()
      .then((result) => {
        if (active) setBatches(result);
      })
      .catch((fetchError) => {
        if (active) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "The verifications could not be loaded."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchQuery, statusParam]);

  const documents = useMemo(() => flattenAndSortDocuments(batches), [batches]);

  const filteredDocuments = useMemo(() => {
    const selectedDecision = statusFilter
      ? STATUS_PARAM_TO_DECISION[statusFilter]
      : null;
    const query = searchQuery.trim().toLowerCase();

    return documents.filter((row: DocRow) => {
      if (selectedDecision && getDecision(row.document) !== selectedDecision) {
        return false;
      }

      if (!query) {
        return true;
      }

      const quotationNumber = extractedFieldValue(
        row.document.quotation_extraction.quotation_number
      ).text.toLowerCase();
      const supplier = extractedFieldValue(
        row.document.quotation_extraction.supplier_name
      ).text.toLowerCase();
      const purchaseRequest = (
        row.document.verification_result.purchase_request_number ?? ""
      ).toLowerCase();

      return (
        quotationNumber.includes(query) ||
        supplier.includes(query) ||
        purchaseRequest.includes(query)
      );
    });
  }, [documents, statusFilter, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDocuments.length / ROWS_PER_PAGE)
  );
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ROWS_PER_PAGE;
  const pageRows = filteredDocuments.slice(
    startIndex,
    startIndex + ROWS_PER_PAGE
  );
  const showingFrom =
    filteredDocuments.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + ROWS_PER_PAGE, filteredDocuments.length);

  const clearFilters = () => {
    setSearchQuery("");
    router.replace("/verifications");
  };

  const pillHref = (key: string) =>
    key === "all" ? "/verifications" : `/verifications?status=${key}`;

  const pillActive = (key: string) =>
    key === "all" ? statusFilter === null : statusFilter === key;

  return (
    <section className="mx-auto w-full max-w-6xl space-y-4 overflow-x-hidden px-4 py-4 md:px-6 md:py-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Verification List
          </h1>
          <p className="text-sm text-muted-foreground">
            View and manage all supplier quotation verifications.
          </p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/verifications/new">
            + New Verification
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by supplier, quotation number or purchase request..."
            aria-label="Search verifications"
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

        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All" },
            { key: "approve", label: "Passed checks" },
            { key: "reject", label: "Rejected" },
            { key: "review", label: "Needs review" },
          ].map((pill) => (
            <Link
              key={pill.key}
              href={pillHref(pill.key)}
              className={`inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors ${
                pillActive(pill.key)
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {pill.label}
            </Link>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6">
          <p className="text-sm font-medium text-danger">
            The verifications could not be loaded.
          </p>
          <p className="mt-1 text-sm text-danger/80">{error}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setReloadKey((value) => value + 1)}
            className="mt-4 h-10 border-danger/30 px-4 text-sm text-danger hover:bg-danger/10 hover:text-danger"
          >
            Try again
          </Button>
        </div>
      ) : loading ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="bg-muted/60 text-left text-xs font-medium text-muted-foreground">
                <th className="px-4 py-3 font-medium">Quotation ID</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Purchase Request</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Decision</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <SkeletonRows />
          </table>
            </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            No verifications yet.
          </p>
          <Button
            asChild
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/verifications/new">New Verification</Link>
          </Button>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            No results match your search or filter.
          </p>
          <Button
            type="button"
            onClick={clearFilters}
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="bg-muted/60 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Quotation ID</th>
                  <th className="px-4 py-3 font-medium">Supplier</th>
                  <th className="px-4 py-3 font-medium">Purchase Request</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Decision</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row: DocRow) => {
                  const quotationId = extractedFieldValue(
                    row.document.quotation_extraction.quotation_number
                  );
                  const supplier = extractedFieldValue(
                    row.document.quotation_extraction.supplier_name
                  );
                  const purchaseRequest =
                    row.document.verification_result.purchase_request_number ?? "—";
                  const decision = getDecision(row.document);
                  const style = decisionStyles(decision);

                  return (
                    <tr
                      key={row.document.document_id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td
                        className={`px-4 py-4 font-medium ${
                          quotationId.missing ? "text-warning" : "text-foreground"
                        }`}
                      >
                        {quotationId.text}
                      </td>
                      <td
                        className={`px-4 py-4 ${
                          supplier.missing ? "text-warning" : "text-muted-foreground"
                        }`}
                      >
                        {supplier.text}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {purchaseRequest}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {formatCheckedOn(row.document.created_at)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${style.pillClassName}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`size-1.5 rounded-full ${style.dotClassName}`}
                          />
                          {style.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/verifications/${row.batchId}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {showingFrom}–{showingTo} of{" "}
              {filteredDocuments.length} results
            </p>
            <nav className="flex items-center gap-1" aria-label="Pagination">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1;
                const active = page === safePage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`inline-flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() =>
                  setCurrentPage((value) => Math.min(totalPages, value + 1))
                }
                className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </button>
            </nav>
          </div>
        </>
      )}
    </section>
  );
}

export default function VerificationsPage() {
  return (
    <Suspense
      fallback={
        <p className="p-8 text-sm text-muted-foreground">
          Loading verifications...
        </p>
      }
    >
      <VerificationsContent />
    </Suspense>
  );
}
