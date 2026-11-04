import type { ReactNode } from "react";
import { Suspense } from "react";

import { AppSidebar, MobileSidebar } from "@/components/layout/app-sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Suspense fallback={<aside className="hidden w-[258px] shrink-0 border-r border-border bg-card lg:block" />}>
        <AppSidebar />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Suspense fallback={<div className="h-16 border-b border-border bg-card lg:hidden" />}>
          <MobileSidebar />
        </Suspense>
        <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading...</p>}>
          <main className="flex-1">{children}</main>
        </Suspense>
      </div>
    </div>
  );
}
