import type { ReactNode } from "react";
import { Suspense } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Suspense fallback={<aside className="w-64 shrink-0 border-r border-border bg-card" />}>
        <AppSidebar />
      </Suspense>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Suspense fallback={null}>
          <TopBar />
        </Suspense>
        <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading...</p>}>
          <main className="flex-1">{children}</main>
        </Suspense>
      </div>
    </div>
  );
}
