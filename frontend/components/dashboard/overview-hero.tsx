import Link from "next/link";

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 150 150"
      role="img"
      aria-label="Document with a verified shield"
      className="h-16 w-16 shrink-0 md:h-24 md:w-24"
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
    <section className="relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-r from-[#EEF4FF] via-[#E7F0FF] to-[#DCE9FF] px-5 py-5 dark:bg-gradient-to-r dark:from-[#18233C] dark:via-[#162036] dark:to-[#131C2F] md:h-[180px] md:px-8 md:py-0">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-40 hidden size-[420px] rounded-full bg-[#C6DAFF]/70 dark:bg-primary/15 md:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-44 top-6 hidden size-[380px] rounded-full bg-[#AFC9FF]/50 dark:bg-primary/10 md:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-40 hidden size-[300px] rounded-full bg-[#D7E5FF]/60 dark:bg-primary/[0.07] md:block"
      />

      <div className="relative z-10 flex h-full flex-col items-start gap-4 md:flex-row md:items-center md:gap-6">
        <HeroIllustration />

        <div className="min-w-0 flex-1">
          <h2 className="text-[22px] font-semibold tracking-tight text-[#111827] dark:text-foreground">
            Ready to verify a quotation?
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-slate-600 dark:text-muted-foreground">
            Upload a supplier quotation and check it against your purchase
            requirements and company rules.
          </p>
        </div>

        <Link
          href="/verifications/new"
          className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 md:w-auto"
        >
          Start New Verification →
        </Link>
      </div>
    </section>
  );
}
