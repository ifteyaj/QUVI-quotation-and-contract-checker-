import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DashboardDocument } from "@/lib/dashboard";
import {
  fieldLabel,
  formatSubmittedDate,
  getDecision,
  getDecisionAriaLabel,
  getDecisionStyle,
} from "@/lib/dashboard";
import { cn } from "@/lib/utils";

function StatusPill({ row }: { row: DashboardDocument }) {
  const decision = getDecision(row.document);
  const style = getDecisionStyle(decision);

  return (
    <span
      aria-label={getDecisionAriaLabel(row.document)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        style.pillClassName
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", style.dotClassName)}
      />
      {style.label}
    </span>
  );
}

export function RecentQuotations({
  rows,
  totalDocuments,
  onClearSearch,
}: {
  rows: DashboardDocument[];
  totalDocuments: number;
  onClearSearch: () => void;
}) {
  return (
    <div className="flex min-h-[320px] lg:h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex h-9 shrink-0 items-center justify-between gap-6 px-4 pt-4">
        <div>
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground">
            Recent Quotations
          </h2>
        </div>
        <Link
          href="/verifications"
          className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-medium text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          View All
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="min-w-0 flex-1 overflow-x-auto overflow-y-auto px-4 pb-3">
        {totalDocuments === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FileText className="size-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              No quotations checked yet.
            </p>
            <Button asChild className="mt-4 h-10 px-4 text-sm">
              <Link href="/verifications/new">Start New Verification</Link>
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-sm font-medium text-foreground">
              No quotations match your search.
            </p>
            <button
              type="button"
              onClick={onClearSearch}
              className="mt-2 text-sm font-medium text-primary hover:text-primary/80"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[14px]">
              <thead>
                <tr className="h-auto lg:h-11 bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="rounded-l-lg px-4 py-2.5 font-medium">Supplier</th>
                  <th className="px-4 py-2.5 font-medium">Quotation ID</th>
                  <th className="px-4 py-2.5 font-medium">Submitted</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="rounded-r-lg px-4 py-2.5 text-right font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.document.document_id}
                    className="h-auto lg:h-11 border-b border-border/70 last:border-b-0"
                  >
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {fieldLabel(row.document.quotation_extraction.supplier_name)}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {fieldLabel(row.document.quotation_extraction.quotation_number)}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {formatSubmittedDate(row.document.created_at)}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusPill row={row} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/verifications/${row.batchId}`}
                        className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      >
                        View
                        <ArrowRight className="size-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
