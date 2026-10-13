import {
  Sun,
  Moon,
  ArrowRight,
  ChartNoAxesCombined,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { HeroChart } from "@/components/hero-chart"
import { TrustBadges } from "@/components/trust-badges"
import { CumulativeSection, MultiGrantSection, YearlySection } from "@/components/feature-sections"
import { ScrollAnimate } from "@/components/scroll-animate"
import { cn } from "@/lib/utils"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  function toggle() {
    if (theme === "dark") {
      setTheme("light")
    } else if (theme === "light") {
      setTheme("dark")
    } else {
      const isDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
      setTheme(isDark ? "light" : "dark")
    }
  }

  return (
    <button
      onClick={toggle}
      className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-[color,background-color,scale] duration-150 ease-out hover:bg-accent hover:text-accent-foreground active:scale-95"
      aria-label="Toggle theme"
    >
      {/* Crossfade: never from scale(0), and the blur hides the overlap */}
      <Sun className="size-4 transition-[opacity,scale,filter] duration-200 ease-out dark:scale-50 dark:opacity-0 dark:blur-[2px]" />
      <Moon className="absolute size-4 scale-50 opacity-0 blur-[2px] transition-[opacity,scale,filter] duration-200 ease-out dark:scale-100 dark:opacity-100 dark:blur-none" />
    </button>
  )
}

function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <ChartNoAxesCombined className="size-5" />
          <span className="text-sm font-semibold tracking-tight">
            VestWise
          </span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}

function CtaLink({ className }: { className?: string }) {
  return (
    <a
      href="https://app.vestwise.app"
      className={cn(
        "group inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-[background-color,scale] duration-150 ease-out hover:bg-primary/90 active:scale-[0.97]",
        className
      )}
    >
      Open app
      <ArrowRight className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
    </a>
  )
}

function Hero() {
  return (
    <section className="relative pt-14">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--muted)_0%,transparent_60%)]" />
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23808080' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-24 sm:pt-32 md:pt-40">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
            Stock option tracker
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Your stock options,
            <br />
            finally clear.
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            VestWise helps you understand your equity. Track vesting
            schedules, visualize milestones, and model what your options
            could be worth.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <CtaLink />
            <span className="text-xs text-muted-foreground">
              Free &middot; No sign-up required
            </span>
          </div>
        </div>
      </div>

      {/* Chart blending into the background (edge fades live on the chart) */}
      <div className="mx-auto mt-4 max-w-6xl px-6">
        <HeroChart />
      </div>
    </section>
  )
}

function CallToAction() {
  return (
    <section className="border-t border-border/50">
      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
        <ScrollAnimate stagger={60} className="flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Start tracking your vesting
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            No account needed. Your data stays in your browser. Open the
            app and add your first grant in under a minute.
          </p>
          <CtaLink className="mt-8" />
        </ScrollAnimate>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ChartNoAxesCombined className="size-4" />
          <span className="text-xs font-medium">VestWise</span>
        </div>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <TrustBadges />
        <CumulativeSection />
        <MultiGrantSection />
        <YearlySection />
        <CallToAction />
      </main>
      <Footer />
    </div>
  )
}
