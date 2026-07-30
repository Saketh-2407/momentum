"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-32 text-center">
      <span className="text-sm font-medium uppercase tracking-[0.3em] text-destructive">
        Something broke
      </span>
      <h1 className="text-3xl font-semibold tracking-tight">
        That wasn&apos;t supposed to happen.
      </h1>
      <p className="max-w-sm text-balance text-muted-foreground">
        Your data is safe. Try again, or head back to the dashboard.
      </p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
