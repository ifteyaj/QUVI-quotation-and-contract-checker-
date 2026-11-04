import Link from "next/link";
import { ArrowRight, CircleCheck, TriangleAlert } from "lucide-react";

import type { DashboardDocument } from "@/lib/dashboard";
import {
  fieldLabel,
  firstFindingTitle,
} from "@/lib/dashboard";

export function NeedsAttention({ rows }: { rows: DashboardDocument[] }) {
  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#F3E2C7] bg-[#FFF8EE] p-5 shadow-sm dark:border-warning/20 dark:bg-warning/5">
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
          <TriangleAlert className="size-4" />
        </div>
        <div>
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground">
            Needs Attention
          </h2>
          <p className="mt-0.5 text-[14px] text-muted-foreground">
            These quotations need your review.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-success/10 text-success">
            <CircleCheck className="size-5" />
          </div>
          <p className="mt-3 text-[13px] font-medium text-foreground">
            Nothing needs attention right now.
          </p>
        </div>
      ) : (
        <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1">
          {rows.map((row) => (
            <div
              key={row.document.document_id}
              className="rounded-lg border border-[#EFE0C9] bg-card p-2.5 shadow-sm dark:border-warning/15"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-foreground">
                    {fieldLabel(row.document.quotation_extraction.supplier_name)}
                  </p>
                  <p className="mt-0 text-[12px] text-muted-foreground">
                    {fieldLabel(row.document.quotation_extraction.quotation_number)}
                  </p>
                </div>
                <Link
                  href={`/verifications/${row.batchId}`}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-card px-3 py-1 text-[13px] font-medium text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  Review
                </Link>
              </div>
              <p className="mt-1 text-[12px] leading-4 text-muted-foreground">
                {firstFindingTitle(row.document)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto pt-2">
        <Link
          href="/verifications?status=review"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          View Review Queue
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
