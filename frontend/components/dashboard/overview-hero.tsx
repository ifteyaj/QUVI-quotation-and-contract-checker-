import Link from "next/link";
import { ArrowRight } from "lucide-react";

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 150 150"
      role="img"
      aria-label="Document with a verified shield"
      className="h-[72px] w-[72px] shrink-0 md:h-[80px] md:w-[80px]"
    >
      <path
        d="M35 18h58l22 22v82a8 8 0 0 1-8 8H35a8 8 0 0 1-8-8V26a8 8 0 0 1 8-8Z"
        fill="#FFFFFF"
        stroke="#D8E4FA"
        strokeWidth="2"
      />
      <path d="M93 18v17a5 5 0 0 0 5 5h17" fill="#E7EFFD" stroke="#D8E4FA" strokeWidth="2" />
      <rect x="42" y="52" width="48" height="6" rx="3" fill="#D5E1F5" />
      <rect x="42" y="68" width="58" height="6" rx="3" fill="#E1EAF8" />
      <rect x="42" y="84" width="42" height="6" rx="3" fill="#E1EAF8" />
      <rect x="42" y="100" width="30" height="6" rx="3" fill="#E1EAF8" />
      <circle cx="105" cy="105" r="30" fill="#2563EB" />
      <path
        d="M91 105.5 100 114l19-21"
        fill="none"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="7"
      />
      <path
        d="M126 31v10M121 36h10M132 52v7M128.5 55.5h7"
        stroke="#2563EB"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}

export function OverviewHero() {
  return (
    <section className="relative max-h-[120px] h-[120px] overflow-hidden rounded-2xl bg-gradient-to-r from-[#EEF4FF] via-[#E7F0FF] to-[#DCE9FF] px-6 py-4 md:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-40 size-[420px] rounded-full bg-[#C6DAFF]/70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-44 top-6 size-[380px] rounded-full bg-[#AFC9FF]/50"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-40 size-[300px] rounded-full bg-[#D7E5FF]/60"
      />

      <div className="relative z-10 flex h-full flex-col items-center gap-6 sm:flex-row sm:items-center md:gap-8">
        <HeroIllustration />

        <div className="max-w-xl">
          <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
            Ready to verify a quotation?
          </h2>
          <p className="mt-2 max-w-md text-[14px] leading-5 text-slate-600">
            Upload a supplier quotation and check it against your purchase
            requirements and company rules.
          </p>
          <Link
            href="/verifications/new"
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2"
          >
            Start New Verification
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
