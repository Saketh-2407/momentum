"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { commitPlanItems } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlanItem } from "@/lib/planner/types";

type Stage = "input" | "loading" | "review" | "error";

function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function PlannerCard() {
  const [stage, setStage] = useState<Stage>("input");
  const [rawText, setRawText] = useState("");
  const [items, setItems] = useState<PlanItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCommitting, startCommitting] = useTransition();

  async function handleGenerate() {
    if (!rawText.trim()) return;
    setStage("loading");
    setError(null);

    try {
      const response = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      const result = await response.json();

      if (result.error) {
        setError(result.error);
        setStage("error");
        return;
      }

      if (!result.plan?.items?.length) {
        setError("No actionable items found in that — try adding more detail.");
        setStage("error");
        return;
      }

      setItems(result.plan.items);
      setStage("review");
    } catch {
      setError("Couldn't reach the planner. Check your connection and try again.");
      setStage("error");
    }
  }

  function updateItem(index: number, patch: Partial<PlanItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAccept() {
    startCommitting(async () => {
      const result = await commitPlanItems(
        items.map((item) => ({
          title: item.title,
          notes: item.notes,
          importance: item.importance,
          effort: item.effort,
          scheduledAt: item.suggestedScheduledAt,
          deadline: item.deadline,
        })),
      );

      if (result.error) {
        toast.error("Couldn't add those tasks", { description: result.error });
        return;
      }

      toast.success(`Added ${items.length} task${items.length === 1 ? "" : "s"} to your day`);
      setStage("input");
      setRawText("");
      setItems([]);
    });
  }

  if (stage === "input" || stage === "loading" || stage === "error") {
    return (
      <div className="flex flex-col gap-3">
        <Textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Dump everything on your mind — errands, deadlines, half-formed thoughts. Momentum will sort it into an ordered plan."
          rows={4}
          disabled={stage === "loading"}
        />
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={stage === "loading" || !rawText.trim()}
          className="self-start"
        >
          {stage === "loading" ? (
            <>
              <Loader2 className="animate-spin" /> Planning…
            </>
          ) : (
            <>
              <Sparkles /> Generate plan
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {items.map((item, index) => (
          <li key={`${item.title}-${index}`} className="flex flex-col gap-2 rounded-lg border border-border/60 p-3">
            <div className="flex items-start gap-2">
              <div className="flex flex-1 flex-col gap-1">
                <Label htmlFor={`plan-title-${index}`} className="sr-only">
                  Title
                </Label>
                <Input
                  id={`plan-title-${index}`}
                  value={item.title}
                  onChange={(e) => updateItem(index, { title: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">{item.rationale}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove "${item.title}"`}
                onClick={() => removeItem(index)}
              >
                <Trash2 />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`plan-when-${index}`} className="text-xs text-muted-foreground">
                  When
                </Label>
                <Input
                  id={`plan-when-${index}`}
                  type="datetime-local"
                  value={toDatetimeLocalValue(item.suggestedScheduledAt)}
                  onChange={(e) =>
                    updateItem(index, {
                      suggestedScheduledAt: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : item.suggestedScheduledAt,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`plan-importance-${index}`} className="text-xs text-muted-foreground">
                  Importance
                </Label>
                <select
                  id={`plan-importance-${index}`}
                  value={item.importance}
                  onChange={(e) =>
                    updateItem(index, { importance: Number(e.target.value) as PlanItem["importance"] })
                  }
                  className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`plan-effort-${index}`} className="text-xs text-muted-foreground">
                  Effort
                </Label>
                <select
                  id={`plan-effort-${index}`}
                  value={item.effort}
                  onChange={(e) =>
                    updateItem(index, { effort: Number(e.target.value) as PlanItem["effort"] })
                  }
                  className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Button type="button" onClick={handleAccept} disabled={isCommitting || items.length === 0}>
          {isCommitting ? "Adding…" : `Accept & add ${items.length}`}
        </Button>
        <Button type="button" variant="outline" onClick={handleGenerate} disabled={isCommitting}>
          Regenerate
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setStage("input");
            setItems([]);
          }}
          disabled={isCommitting}
        >
          Discard
        </Button>
      </div>
    </div>
  );
}
