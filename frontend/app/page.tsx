import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { DashboardPreviewFrame } from "@/components/welcome/dashboard-preview-frame";
import { ShinyButton } from "@/components/ui/shiny-button";

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

/**
 * Ambient blue atmosphere for the hero.
 *
 * One very large, very low-opacity radial falloff of a single hue. Three
 * details keep it from looking like a stack of circles:
 *  - every stop keeps the same blue and only its opacity changes, instead of
 *    fading to `transparent` (which interpolates through transparent black and
 *    produced the grey halo and band edges);
 *  - the ellipse is far wider than the viewport, so there is no sideways
 *    hotspot — only a gentle wash that is brightest behind the headline;
 *  - the opacity follows (1 - t²)², a bell curve that reaches zero with zero
 *    slope at both centre and rim, then keeps fading in small steps all the way
 *    to 100%, so there is no edge, no seam and no concentrated spot anywhere.
 * No blur filter is used either: blurring an oversized box reintroduces a hard
 * clip at the box boundary.
 */
const AMBIENT_DARK_STYLE = {
  backgroundImage: `
    radial-gradient(140% 72% at 50% 26%,
      rgba(59,130,246,0.130) 0%,
      rgba(59,130,246,0.127) 10%,
      rgba(59,130,246,0.120) 20%,
      rgba(59,130,246,0.108) 30%,
      rgba(59,130,246,0.092) 40%,
      rgba(59,130,246,0.073) 50%,
      rgba(59,130,246,0.053) 60%,
      rgba(59,130,246,0.034) 70%,
      rgba(59,130,246,0.017) 80%,
      rgba(59,130,246,0.005) 90%,
      rgba(59,130,246,0.000) 100%
    )
  `,
} as const;

const AMBIENT_LIGHT_STYLE = {
  backgroundImage: `
    radial-gradient(140% 72% at 50% 26%,
      rgba(37,99,235,0.095) 0%,
      rgba(37,99,235,0.093) 10%,
      rgba(37,99,235,0.088) 20%,
      rgba(37,99,235,0.079) 30%,
      rgba(37,99,235,0.067) 40%,
      rgba(37,99,235,0.053) 50%,
      rgba(37,99,235,0.039) 60%,
      rgba(37,99,235,0.025) 70%,
      rgba(37,99,235,0.012) 80%,
      rgba(37,99,235,0.003) 90%,
      rgba(37,99,235,0.000) 100%
    )
  `,
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
        {/* Ambient blue atmosphere: see AMBIENT_*_STYLE above for why this is a
            single continuous wash rather than stacked blurred circles. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 dark:hidden"
          style={AMBIENT_LIGHT_STYLE}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 hidden dark:block"
          style={AMBIENT_DARK_STYLE}
        />

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
          <ShinyButton href="/dashboard">
            Get Started
            <ArrowRight className="size-4" aria-hidden="true" />
          </ShinyButton>
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
