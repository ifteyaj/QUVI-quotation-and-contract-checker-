"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck2,
  PlusCircle,
  List,
  ClipboardList,
  Scale,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavChild = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavItem = {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavChild[];
};

const navigation: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    label: "Verification",
    icon: FileCheck2,
    children: [
      { label: "New Verification", href: "/verifications/new", icon: PlusCircle },
      { label: "Verification List", href: "/verifications", icon: List },
    ],
  },
  { label: "Purchase Requests", href: "/purchase-requests", icon: ClipboardList },
  { label: "Rules & Policy", href: "/rules-policy", icon: Scale },
  { label: "Settings", href: "/settings", icon: Settings },
];

function isPathActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
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
          if (item.children) {
            const groupActive = item.children.some((child) =>
              isPathActive(pathname, child.href),
            );

            return (
              <div key={item.label} className="space-y-1">
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    groupActive ? "text-primary" : "text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </div>

                <div className="ml-4 space-y-1 border-l border-border pl-3">
                  {item.children.map((child) => {
                    const active = isPathActive(pathname, child.href);

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-primary-light text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <child.icon className="size-4" />
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          const active = item.href ? isPathActive(pathname, item.href) : false;

          return (
            <Link
              key={item.label}
              href={item.href ?? "#"}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted",
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Mock UI data only. Backend integration pending.
        </p>
      </div>
    </aside>
  );
}
