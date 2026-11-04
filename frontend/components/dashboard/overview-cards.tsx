import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { mockOverviewStats } from "@/lib/mock-data";

import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  UserRound,
} from "lucide-react";

const statConfig = {
  total: { icon: TrendingUp, tone: "text-primary", surface: "bg-primary-light" },
  approved: { icon: CheckCircle2, tone: "text-success", surface: "bg-success/10" },
  rejected: { icon: XCircle, tone: "text-danger", surface: "bg-danger/10" },
  review: { icon: UserRound, tone: "text-warning", surface: "bg-warning/10" },
} as const;

export function OverviewCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {mockOverviewStats.map((stat) => {
        const config = statConfig[stat.icon];
        const Icon = config.icon;

        return (
          <Card
            key={stat.label}
            className="rounded-xl border-border shadow-sm transition-none"
          >
            <CardContent className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold text-foreground">
                  {stat.value}
                </p>
              </div>
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg",
                  config.surface,
                )}
              >
                <Icon className={cn("size-5", config.tone)} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
