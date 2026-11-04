import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <TopBar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
