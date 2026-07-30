"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function DemoButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInAnonymously();

    if (error) {
      setLoading(false);
      toast.error("Demo mode isn't available right now", {
        description: error.message,
      });
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className="w-full text-muted-foreground hover:text-foreground"
      onClick={handleClick}
      disabled={loading}
    >
      Try the demo — no account needed
    </Button>
  );
}
