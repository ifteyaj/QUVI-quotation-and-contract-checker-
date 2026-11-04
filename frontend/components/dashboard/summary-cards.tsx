import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  TriangleAlert,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

type SummaryCard = {
  label: string;
  value: number;
  subtitle: string;
  href: string;
  icon: typeof FileText;
  iconClassName: string;
  iconSurfaceClassName: string;
};

function percentOfTotal(count: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((count / total) * 100);
}

export function SummaryCards({
  total,
  approved,
  rejected,
  needsReview,
}: {
  total: number;
  approved: number;
  rejected: number;
  needsReview: number;
}) {
  const cards: SummaryCard[] = [
    {
      label: "Total Quotations",
      value: total,
      subtitle: "Documents processed",
      href: "/verifications",
      icon: FileText,
      iconClassName: "text-primary",
      iconSurfaceClassName: "bg-primary-light",
    },
    {
      label: "Approved",
      value: approved,
      subtitle: `${percentOfTotal(approved, total)}% of total`,
      href: "/verifications?status=approve",
      icon: CheckCircle2,
      iconClassName: "text-success",
      iconSurfaceClassName: "bg-success/10",
    },
    {
      label: "Rejected",
      value: rejected,
      subtitle: `${percentOfTotal(rejected, total)}% of total`,
      href: "/verifications?status=reject",
      icon: XCircle,
      iconClassName: "text-danger",
      iconSurfaceClassName: "bg-danger/10",
    },
    {
      label: "Needs Review",
      value: needsReview,
      subtitle: "Requires your attention",
      href: "/verifications?status=review",
      icon: TriangleAlert,
      iconClassName: "text-warning",
      iconSurfaceClassName: "bg-warning/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="flex h-24 items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                card.iconSurfaceClassName
              )}
            >
              <Icon className={cn("size-4", card.iconClassName)} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-foreground">
                {card.label}
              </p>
              <p className="mt-0.5 text-[24px] font-semibold leading-none tracking-tight text-foreground">
                {card.value}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {card.subtitle}
              </p>
            </div>

            <Link
              href={card.href}
              aria-label={`View ${card.label.toLowerCase()}`}
              className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <ArrowRight className="size-3.5 md:size-4" />
            </Link>
          </div>
        );
      })}
    </div>
  );
}
