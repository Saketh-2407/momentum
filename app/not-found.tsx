import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-32 text-center">
      <span className="text-sm font-medium uppercase tracking-[0.3em] text-primary">404</span>
      <h1 className="text-3xl font-semibold tracking-tight">This page took a day off.</h1>
      <p className="max-w-sm text-balance text-muted-foreground">
        Nothing lives at this address. Let&apos;s get you back on track.
      </p>
      <Link href="/" className={buttonVariants()}>
        Back to Momentum
      </Link>
    </div>
  );
}
