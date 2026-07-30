"use client";

import { useActionState, useRef, useEffect } from "react";
import { createTask, type ActionState } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = {};

export function TaskForm() {
  const [state, formAction, pending] = useActionState(createTask, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="task-title">New task</Label>
        <Input id="task-title" name="title" placeholder="Write the report" required />
      </div>
      <Textarea id="task-notes" name="notes" placeholder="Notes (optional)" rows={2} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-scheduled" className="text-xs text-muted-foreground">
            Scheduled
          </Label>
          <Input id="task-scheduled" name="scheduledAt" type="datetime-local" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-deadline" className="text-xs text-muted-foreground">
            Deadline
          </Label>
          <Input id="task-deadline" name="deadline" type="datetime-local" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-importance" className="text-xs text-muted-foreground">
            Importance
          </Label>
          <select
            id="task-importance"
            name="importance"
            defaultValue="3"
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-effort" className="text-xs text-muted-foreground">
            Effort
          </Label>
          <select
            id="task-effort"
            name="effort"
            defaultValue="3"
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
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Adding…" : "Add task"}
      </Button>
    </form>
  );
}
