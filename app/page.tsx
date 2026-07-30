import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-32 text-center">
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
        <Button render={<Link href="/signup" />} size="lg">
          Get started
        </Button>
        <Button render={<Link href="/login" />} size="lg" variant="outline">
          Log in
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Or{" "}
        <Link href="/signup" className="underline underline-offset-4">
          try the demo
        </Link>{" "}
        — no account needed.
      </p>
    </div>
  );
}
