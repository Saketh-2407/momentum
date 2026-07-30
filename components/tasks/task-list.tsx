"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { setTaskStatus, deleteTask } from "@/app/dashboard/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { sortForDayView } from "@/lib/tasks/scheduling";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/database.types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

function TaskRow({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();
  const isDone = task.status === "done";

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5",
        isPending && "opacity-60",
      )}
    >
      <Checkbox
        checked={isDone}
        onCheckedChange={(checked) =>
          startTransition(() => {
            setTaskStatus(task.id, checked ? "done" : "todo");
          })
        }
        aria-label={`Mark "${task.title}" as ${isDone ? "not done" : "done"}`}
      />
      <div className="flex flex-1 flex-col">
        <span className={cn("text-sm", isDone && "text-muted-foreground line-through")}>
          {task.title}
        </span>
        {task.scheduled_at ? (
          <span className="text-xs text-muted-foreground">
            {timeFormatter.format(new Date(task.scheduled_at))}
          </span>
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete "${task.title}"`}
        onClick={() => startTransition(() => deleteTask(task.id))}
      >
        <Trash2 />
      </Button>
    </li>
  );
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  const { scheduled, unscheduled } = sortForDayView(
    tasks.map((task) => ({ ...task, scheduledAt: task.scheduled_at })),
  );

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tasks yet — add your first one above.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {scheduled.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {scheduled.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      ) : null}
      {unscheduled.length > 0 ? (
        <div className="flex flex-col gap-2">
          {scheduled.length > 0 ? (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Unscheduled
            </p>
          ) : null}
          <ul className="flex flex-col gap-2">
            {unscheduled.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
