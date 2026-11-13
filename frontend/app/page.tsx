import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DashboardPreviewFrame } from "@/components/welcome/dashboard-preview-frame";

/** Faint hairline grid, faded out radially from the top centre of the hero. */
const GRID_LIGHT_STYLE = {
  backgroundImage:
    "linear-gradient(to right, rgba(100,116,139,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(100,116,139,0.08) 1px, transparent 1px)",
  backgroundSize: "56px 56px",
  maskImage:
    "radial-gradient(ellipse 70% 60% at 50% 0%, black 28%, transparent 74%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 70% 60% at 50% 0%, black 28%, transparent 74%)",
} as const;

const GRID_DARK_STYLE = {
  ...GRID_LIGHT_STYLE,
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
} as const;

export default function WelcomePage() {
  return (
    <main className="relative min-h-dvh overflow-clip bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[540px] dark:hidden"
        style={GRID_LIGHT_STYLE}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 hidden h-[540px] dark:block"
        style={GRID_DARK_STYLE}
      />

      <section className="relative z-10 flex flex-col items-center px-6 pb-0 pt-16 text-center sm:pt-24">
        {/* Ambient blue atmosphere: large overlapping radials, heavily blurred,
            so there is no visible circle or hotspot — just a faint blue wash. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute left-1/2 top-[16%] h-[720px] w-[1240px] max-w-[150vw] -translate-x-1/2 -translate-y-1/2 bg-radial from-primary/[0.035] to-transparent to-70% blur-3xl" />
          <div className="absolute left-1/2 top-[40%] h-[680px] w-[1120px] max-w-[140vw] -translate-x-1/2 -translate-y-1/2 bg-radial from-primary/[0.055] via-primary/[0.02] to-transparent to-75% blur-3xl" />
          <div className="absolute left-1/2 top-[60%] h-[540px] w-[880px] -translate-x-1/2 -translate-y-1/2 bg-radial from-primary/[0.045] to-transparent to-70% blur-3xl" />
          <div className="absolute left-1/2 top-[78%] h-[600px] w-[1160px] max-w-[140vw] -translate-x-1/2 -translate-y-1/2 bg-radial from-primary/[0.06] via-primary/[0.025] to-transparent to-75% blur-3xl" />
          <div className="absolute left-1/2 top-[90%] h-[380px] w-[760px] -translate-x-1/2 -translate-y-1/2 bg-radial from-primary/[0.04] to-transparent to-70% blur-3xl" />
        </div>

        <div className="relative z-20 flex items-center justify-center">
          <Image
            src="/QUVI_logo.svg"
            alt="QUVI"
            width={242}
            height={88}
            priority
            className="h-10 w-auto object-contain dark:hidden sm:h-12"
          />
          <Image
            src="/QUVI_logo_2.svg"
            alt="QUVI"
            width={242}
            height={88}
            priority
            className="hidden h-10 w-auto object-contain dark:block sm:h-12"
          />
        </div>

        <h1 className="relative z-20 mt-8 inline-block max-w-full bg-gradient-to-r from-foreground via-foreground/85 to-foreground/45 bg-clip-text text-4xl font-semibold leading-[1.08] tracking-tighter text-transparent drop-shadow-2xl sm:mt-10 sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
          Make supplier decisions
          <br />
          with confidence.
        </h1>

        <p className="relative z-20 mt-5 max-w-[620px] text-balance text-[15px] font-medium leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8">
          Verify supplier quotations against purchase requests and procurement
          rules.
        </p>

        <div className="relative z-20 mt-8 flex w-full justify-center sm:mt-9">
          <Link
            href="/dashboard"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-foreground px-8 text-[15px] font-medium text-background shadow-sm transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 sm:w-auto"
          >
            Get Started
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div
          id="product-preview"
          className="relative z-10 mt-12 w-full max-w-[1000px] sm:mt-16"
        >
          <DashboardPreviewFrame />
        </div>
      </section>
    </main>
  );
}
