"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  Scale,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Verifications", href: "/verifications", icon: ShieldCheck },
  { label: "Purchase Requests", href: "/purchase-requests", icon: ClipboardList },
  { label: "Rules & Policy", href: "/rules-policy", icon: Scale },
  { label: "Settings", href: "/settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">QUVI</p>
          <p className="text-xs text-muted-foreground">Quotation checker</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Primary navigation">
        {navigation.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-light text-primary"
                  : "text-foreground hover:bg-muted"
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
            GC
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              Garment Co. Ltd.
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Business Account
            </p>
          </div>
          <Building2 className="ml-auto size-4 text-muted-foreground" />
        </div>
      </div>
    </aside>
  );
}
