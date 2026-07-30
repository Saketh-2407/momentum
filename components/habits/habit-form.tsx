"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { createHabit, type ActionState } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: ActionState = {};
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function HabitForm() {
  const [state, formAction, pending] = useActionState(createHabit, initialState);
  const [cadenceType, setCadenceType] = useState<"daily" | "weekly">("daily");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      setCadenceType("daily");
      setSelectedDays([]);
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="habit-title">New habit</Label>
        <Input id="habit-title" name="title" placeholder="Read 20 minutes" required />
      </div>
      <div className="flex gap-2" role="radiogroup" aria-label="Cadence">
        <Button
          type="button"
          size="sm"
          variant={cadenceType === "daily" ? "default" : "outline"}
          aria-pressed={cadenceType === "daily"}
          onClick={() => setCadenceType("daily")}
        >
          Daily
        </Button>
        <Button
          type="button"
          size="sm"
          variant={cadenceType === "weekly" ? "default" : "outline"}
          aria-pressed={cadenceType === "weekly"}
          onClick={() => setCadenceType("weekly")}
        >
          Specific days
        </Button>
      </div>
      <input type="hidden" name="cadenceType" value={cadenceType} />
      {cadenceType === "weekly" ? (
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAY_LABELS.map((label, day) => (
            <label
              key={day}
              className={cn(
                "flex size-8 cursor-pointer items-center justify-center rounded-lg border border-input text-xs font-medium",
                selectedDays.includes(day) && "border-transparent bg-primary text-primary-foreground",
              )}
            >
              <input
                type="checkbox"
                name="daysOfWeek"
                value={day}
                checked={selectedDays.includes(day)}
                onChange={() => toggleDay(day)}
                className="sr-only"
              />
              {label[0]}
            </label>
          ))}
        </div>
      ) : null}
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Adding…" : "Add habit"}
      </Button>
    </form>
  );
}
