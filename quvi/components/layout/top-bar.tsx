"use client";

import { Bell } from "lucide-react";

export function TopBar() {
  return (
    <header className="flex h-16 items-center justify-end gap-3 border-b border-border bg-card px-6">
      <button
        type="button"
        aria-label="Notifications"
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-4" />
      </button>
      <div className="flex size-9 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
        GC
      </div>
    </header>
  );
}
