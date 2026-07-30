import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { HowItWorks } from "@/components/marketing/how-it-works";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="flex flex-col items-center justify-center gap-8 px-4 py-32 text-center">
        <span className="text-sm font-medium uppercase tracking-[0.3em] text-primary">
          Momentum
        </span>
        <h1 className="max-w-2xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Turn your to-do list into a game you actually want to play.
        </h1>
        <p className="max-w-xl text-balance text-lg text-muted-foreground">
          An AI planner that decides what matters most, streaks that keep you
          coming back, and friends to keep you honest.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            Get started
          </Link>
          <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
            Log in
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Or{" "}
          <Link href="/signup" className="underline underline-offset-4">
            try the demo
          </Link>{" "}
          — no account needed.
        </p>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-20">
        <ScrollReveal className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Everything a to-do list forgot
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-balance text-muted-foreground">
            Momentum isn&apos;t a checklist with badges bolted on — the game mechanics are the
            product.
          </p>
        </ScrollReveal>
        <FeatureGrid />
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-20">
        <ScrollReveal className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
        </ScrollReveal>
        <HowItWorks />
      </section>

      <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-24 text-center">
        <ScrollReveal className="flex flex-col items-center gap-6">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Your streak starts the moment you sign up.
          </h2>
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            Get started free
          </Link>
        </ScrollReveal>
      </section>

      <footer className="border-t border-border/60 px-4 py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Momentum</span>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-foreground">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
