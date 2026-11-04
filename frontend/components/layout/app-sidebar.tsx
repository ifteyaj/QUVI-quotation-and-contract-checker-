"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, useState } from "react";
import { useTheme } from "next-themes";
import {
  Building2,
  ClipboardList,
  FileSearch,
  House,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  X,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavigationItem = {
  label: string;
  icon: typeof House;
  href?: string;
  comingSoon?: boolean;
};

const primaryNavigation: NavigationItem[] = [
  { label: "Overview", href: "/", icon: House },
  { label: "New Verification", href: "/verifications/new", icon: Zap },
  { label: "Verification List", href: "/verifications", icon: FileSearch },
  { label: "Purchase Requisitions", href: "/purchase-requests", icon: ClipboardList },
  { label: "Rules & Policies", href: "/rules-policy", icon: ShieldCheck },
];

const secondaryNavigation: NavigationItem[] = [];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/verifications") {
    return (
      pathname === href ||
      (pathname.startsWith(`${href}/`) &&
        !pathname.startsWith("/verifications/new"))
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationRow({
  item,
  active,
  onNavigate,
}: {
  item: NavigationItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  if (item.comingSoon || !item.href) {
    return (
      <div
        aria-disabled="true"
        className="flex h-10 cursor-not-allowed items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground/60"
      >
        <Icon className="size-[18px] shrink-0" />
        <span className="whitespace-nowrap">{item.label}</span>
        <span className="ml-auto shrink-0 whitespace-nowrap rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-muted-foreground">
          Coming soon
        </span>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
        active
          ? "bg-primary-light text-primary"
          : "text-foreground hover:bg-muted"
      )}
    >
      <Icon className="size-[18px]" />
      <span>{item.label}</span>
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const pathname = usePathname();

  return (
    <>
      <div className="flex h-16 items-center border-b border-border px-4">
        <div className="flex flex-col justify-center gap-1">
          <Image
            src={mounted && resolvedTheme === "dark" ? "/QUVI_logo_2.svg" : "/QUVI_logo.svg"}
            alt="QUVI"
            width={242}
            height={88}
            className="h-11 w-auto max-w-[215px] object-contain"
          />
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pt-3 pb-3" aria-label="Primary navigation">
        {primaryNavigation.map((item) => (
          <NavigationRow
            key={item.label}
            item={item}
            active={Boolean(item.href && isActive(pathname, item.href))}
            onNavigate={onNavigate}
          />
        ))}

        {secondaryNavigation.map((item) => (
          <NavigationRow
            key={item.label}
            item={item}
            active={false}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="flex items-center gap-1 px-3 py-2">
        <button
          type="button"
          aria-label="Toggle colour theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </button>
      </div>

      <div className="border-t border-border px-3 py-2">
        <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground mt-0">
            <Building2 className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold leading-tight text-foreground">
              Aamar Garments Ltd
            </p>
            <p className="text-[10px] text-muted-foreground">
              Business Account
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden h-screen w-[258px] shrink-0 flex-col border-r border-border bg-card lg:flex">
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            QUVI
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {open ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/30"
          />
          <div className="absolute inset-y-0 left-0 flex w-[280px] flex-col overflow-y-auto border-r border-border bg-card">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
