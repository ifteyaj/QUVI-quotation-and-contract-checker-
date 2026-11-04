import Link from "next/link";
import { ArrowRight, CircleCheck, TriangleAlert } from "lucide-react";

import type { DashboardDocument } from "@/lib/dashboard";
import {
  fieldLabel,
  firstFindingTitle,
} from "@/lib/dashboard";

export function NeedsAttention({ rows }: { rows: DashboardDocument[] }) {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-2xl border border-[#F3E2C7] bg-[#FFF8EE] p-6 shadow-sm dark:border-warning/20 dark:bg-warning/5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
          <TriangleAlert className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Needs Attention
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These quotations need your review.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-success/10 text-success">
            <CircleCheck className="size-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">
            Nothing needs attention right now.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {rows.map((row) => (
            <div
              key={row.document.document_id}
              className="rounded-xl border border-[#EFE0C9] bg-card p-4 shadow-sm dark:border-warning/15"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {fieldLabel(row.document.quotation_extraction.supplier_name)}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {fieldLabel(row.document.quotation_extraction.quotation_number)}
                  </p>
                </div>
                <Link
                  href={`/verifications/${row.batchId}`}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-card px-3.5 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  Review
                </Link>
              </div>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">
                {firstFindingTitle(row.document)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto pt-5">
        <Link
          href="/verifications?status=review"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          View Review Queue
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
