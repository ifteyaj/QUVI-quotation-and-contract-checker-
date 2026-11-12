import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function WelcomePage() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-x-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-[#EEF4FF] to-transparent dark:from-primary/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 size-[520px] max-w-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#DCE9FF]/50 blur-3xl dark:bg-primary/5"
      />

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <div className="flex w-full max-w-2xl flex-col items-center text-center">
          <Image
            src="/QUVI_logo.svg"
            alt="QUVI"
            width={242}
            height={88}
            priority
            className="h-12 w-auto object-contain dark:hidden sm:h-14"
          />
          <Image
            src="/QUVI_logo_2.svg"
            alt="QUVI"
            width={242}
            height={88}
            priority
            className="hidden h-12 w-auto object-contain dark:block sm:h-14"
          />

          <h1 className="mt-8 text-[32px] font-semibold leading-[1.15] tracking-tight text-foreground sm:text-[40px] lg:text-5xl">
            Verify supplier quotations with confidence.
          </h1>

          <p className="mt-5 max-w-xl text-[15px] leading-7 text-muted-foreground sm:text-base">
            Review supplier quotations against purchase requests and procurement
            rules. Identify risks, compare details, and make better procurement
            decisions.
          </p>

          <Link
            href="/dashboard"
            className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 text-[15px] font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 sm:w-auto"
          >
            Get Started
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
