import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome{claims?.email ? `, ${claims.email}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {claims?.is_anonymous
              ? "You're exploring in demo mode — your data may be cleared."
              : "You're signed in."}
          </p>
        </div>
        {claims?.is_anonymous ? <Badge variant="secondary">Demo</Badge> : null}
      </div>
      <p className="text-sm text-muted-foreground">
        The full dashboard — completion ring, streak flame, XP bar, and insights —
        arrives in Phase 2. This confirms auth, RLS, and the design system are
        wired end to end.
      </p>
      <form action="/auth/signout" method="post">
        <Button type="submit" variant="outline">
          Log out
        </Button>
      </form>
    </div>
  );
}
