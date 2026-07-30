"use client";

import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  publishWorkbookFromSelection,
  setWorkbookPublished,
  deleteWorkbook,
  cloneWorkbook,
} from "@/app/dashboard/social/actions";
import type { ActionState } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/lib/supabase/database.types";

type Workbook = Database["public"]["Tables"]["workbooks"]["Row"];

const initialState: ActionState = {};

export function WorkbooksSection({
  myWorkbooks,
  browseWorkbooks,
  tasks,
  habits,
}: {
  myWorkbooks: Workbook[];
  browseWorkbooks: Workbook[];
  tasks: { id: string; title: string }[];
  habits: { id: string; title: string }[];
}) {
  const [state, formAction, pending] = useActionState(publishWorkbookFromSelection, initialState);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="workbook-title">Publish a workbook</Label>
          <Input id="workbook-title" name="title" placeholder="Morning Reset" required />
        </div>
        <Textarea name="description" placeholder="What's this routine for? (optional)" rows={2} />
        {tasks.length > 0 || habits.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {tasks.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground">Tasks</p>
                {tasks.map((task) => (
                  <label key={task.id} className="flex items-center gap-2 text-sm">
                    <Checkbox name="taskIds" value={task.id} />
                    {task.title}
                  </label>
                ))}
              </div>
            ) : null}
            {habits.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground">Habits</p>
                {habits.map((habit) => (
                  <label key={habit.id} className="flex items-center gap-2 text-sm">
                    <Checkbox name="habitIds" value={habit.id} />
                    {habit.title}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Add some tasks or habits first to bundle them into a workbook.
          </p>
        )}
        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Publishing…" : "Publish workbook"}
        </Button>
      </form>

      {myWorkbooks.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Your workbooks
          </p>
          <ul className="flex flex-col gap-2">
            {myWorkbooks.map((wb) => (
              <li
                key={wb.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{wb.title}</span>
                  <Badge variant={wb.is_published ? "default" : "secondary"}>
                    {wb.is_published ? "Published" : "Unpublished"}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      startTransition(() => setWorkbookPublished(wb.id, !wb.is_published))
                    }
                  >
                    {wb.is_published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => startTransition(() => deleteWorkbook(wb.id))}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Browse
        </p>
        {browseWorkbooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No published workbooks from others yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {browseWorkbooks.map((wb) => (
              <BrowseRow key={wb.id} workbook={wb} pending={isPending} startTransition={startTransition} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function BrowseRow({
  workbook,
  startTransition,
}: {
  workbook: Workbook;
  pending: boolean;
  startTransition: (fn: () => void | Promise<void>) => void;
}) {
  const [cloning, setCloning] = useState(false);

  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2">
      <div className="flex flex-col">
        <span className="text-sm">{workbook.title}</span>
        <span className="text-xs text-muted-foreground">by {workbook.owner_display_name ?? "a Momentum user"}</span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={cloning}
        onClick={() =>
          startTransition(async () => {
            setCloning(true);
            const result = await cloneWorkbook(workbook.id);
            setCloning(false);
            if (result.error) {
              toast.error("Couldn't clone that workbook", { description: result.error });
            } else {
              toast.success(`Cloned "${workbook.title}" into your day`);
            }
          })
        }
      >
        {cloning ? "Cloning…" : "Clone"}
      </Button>
    </li>
  );
}
