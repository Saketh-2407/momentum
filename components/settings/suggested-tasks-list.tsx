"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { acceptSuggestedTask, dismissSuggestedTask } from "@/app/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Database } from "@/lib/supabase/database.types";

type SuggestedTask = Database["public"]["Tables"]["suggested_tasks"]["Row"];

function SuggestionRow({ suggestion }: { suggestion: SuggestedTask }) {
  const [title, setTitle] = useState(suggestion.title);
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptSuggestedTask(suggestion.id, title);
      if (result.error) {
        toast.error("Couldn't add that task", { description: result.error });
      } else {
        toast.success("Added to your day");
      }
    });
  }

  function handleDismiss() {
    startTransition(() => dismissSuggestedTask(suggestion.id));
  }

  return (
    <li className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isPending}
        className="flex-1"
        aria-label="Suggested task title"
      />
      <Button type="button" size="sm" disabled={isPending} onClick={handleAccept}>
        Accept
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={handleDismiss}>
        Dismiss
      </Button>
    </li>
  );
}

export function SuggestedTasksList({ suggestions }: { suggestions: SuggestedTask[] }) {
  if (suggestions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No suggestions right now — hit &quot;Sync now&quot; above to check for action-worthy emails.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {suggestions.map((suggestion) => (
        <SuggestionRow key={suggestion.id} suggestion={suggestion} />
      ))}
    </ul>
  );
}
