import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { RecentVerifications } from "@/components/dashboard/recent-verifications";

export default function DashboardPage() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 p-6 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of your supplier quotation verifications.
          </p>
        </div>

        <Button
          asChild
          size="default"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Link href="/verifications/new">
            <Plus className="size-4" />
            New Verification
          </Link>
        </Button>
      </header>

      <OverviewCards />
      <RecentVerifications />
    </section>
  );
}
