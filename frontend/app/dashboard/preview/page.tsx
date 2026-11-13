import { Search } from "lucide-react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { NeedsAttention } from "@/components/dashboard/needs-attention";
import { OverviewHero } from "@/components/dashboard/overview-hero";
import { RecentQuotations } from "@/components/dashboard/recent-quotations";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { PREVIEW_DOCUMENTS, previewCounts } from "@/lib/preview-data";

export const metadata = {
  title: "QUVI — Interface preview",
  description: "Static preview of the QUVI dashboard interface.",
  robots: { index: false, follow: false },
};

/**
 * Static, sample-data replica of the working dashboard, used inside the
 * welcome page's product preview frame. It reuses the real dashboard
 * components and never calls the backend. The working dashboard remains at
 * `/dashboard`.
 */
export default function DashboardPreviewPage() {
  const counts = previewCounts(PREVIEW_DOCUMENTS);
  const recentRows = PREVIEW_DOCUMENTS.slice(0, 5);
  const attentionRows = PREVIEW_DOCUMENTS.filter(({ document }) => {
    const decision = document.verification_result.decision.decision;
    return decision === "REJECT" || decision === "NEEDS_HUMAN_REVIEW";
  }).slice(0, 3);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <main className="flex-1">
          <section className="flex h-full w-full flex-col gap-4 overflow-hidden px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
            <header className="flex shrink-0 flex-col gap-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between md:gap-4">
              <h1 className="text-[22px] font-semibold leading-7 tracking-tight text-foreground">
                Overview
              </h1>

              <div className="relative w-full sm:max-w-[340px] md:w-[340px]">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <div
                  aria-hidden="true"
                  className="flex h-10 w-full items-center rounded-lg border border-border bg-card pl-10 pr-3 text-sm text-muted-foreground/70"
                >
                  Search quotations, suppliers...
                </div>
              </div>
            </header>

            <OverviewHero />

            <SummaryCards
              total={counts.total}
              approved={counts.approved}
              rejected={counts.rejected}
              needsReview={counts.needsReview}
            />

            <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[1.85fr_1fr]">
              <RecentQuotations
                rows={recentRows}
                totalDocuments={PREVIEW_DOCUMENTS.length}
                onClearSearch={() => {}}
              />
              <NeedsAttention rows={attentionRows} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
