"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Play, Pause, RotateCcw } from "lucide-react";
import { completeFocusSession } from "@/app/dashboard/standout/actions";
import { showLevelUpToast } from "@/components/gamification/level-up-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DURATIONS = [15, 25, 45];
const NO_TASK_VALUE = "__none__";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function FocusTimer({
  tasks,
}: {
  tasks: { id: string; title: string }[];
}) {
  const [durationMinutes, setDurationMinutes] = useState(DURATIONS[1]);
  const [taskId, setTaskId] = useState<string>("");
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS[1] * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const hasCompletedRef = useRef(false);

  const isFinished = secondsLeft === 0;

  useEffect(() => {
    if (!isRunning || isFinished) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isFinished]);

  useEffect(() => {
    if (!isFinished || hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    completeFocusSession(durationMinutes, taskId || null).then((result) => {
      if (result.error) {
        toast.error("Couldn't log that session", { description: result.error });
        return;
      }
      toast.success(`Focus session complete — +${result.xpAwarded} XP`);
      if (result.leveledUp && result.newLevel) {
        showLevelUpToast(result.newLevel);
      }
    });
  }, [isFinished, durationMinutes, taskId]);

  function selectDuration(minutes: number) {
    if (isRunning) return;
    setDurationMinutes(minutes);
    setSecondsLeft(minutes * 60);
    setHasStarted(false);
    hasCompletedRef.current = false;
  }

  function handleStartPause() {
    setHasStarted(true);
    setIsRunning((prev) => !prev);
  }

  function handleReset() {
    setIsRunning(false);
    setSecondsLeft(durationMinutes * 60);
    setHasStarted(false);
    hasCompletedRef.current = false;
  }

  const percentElapsed = ((durationMinutes * 60 - secondsLeft) / (durationMinutes * 60)) * 100;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        {DURATIONS.map((minutes) => (
          <Button
            key={minutes}
            type="button"
            size="sm"
            variant={durationMinutes === minutes ? "default" : "outline"}
            disabled={isRunning}
            onClick={() => selectDuration(minutes)}
          >
            {minutes}m
          </Button>
        ))}
      </div>

      {tasks.length > 0 ? (
        <Select
          value={taskId || NO_TASK_VALUE}
          onValueChange={(value) => setTaskId(!value || value === NO_TASK_VALUE ? "" : value)}
          disabled={isRunning}
          items={[
            { value: NO_TASK_VALUE, label: "No specific task" },
            ...tasks.map((task) => ({ value: task.id, label: task.title })),
          ]}
        >
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_TASK_VALUE}>No specific task</SelectItem>
            {tasks.map((task) => (
              <SelectItem key={task.id} value={task.id}>
                {task.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <div className="relative flex size-32 items-center justify-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={2 * Math.PI * 45 * (1 - percentElapsed / 100)}
            className={cn(!isRunning && "transition-none")}
          />
        </svg>
        <span className="text-2xl font-semibold tabular-nums">{formatTime(secondsLeft)}</span>
      </div>

      <div className="flex gap-2">
        <Button type="button" onClick={handleStartPause} disabled={isFinished}>
          {isFinished ? (
            <>
              <Play /> Session complete
            </>
          ) : isRunning ? (
            <>
              <Pause /> Pause
            </>
          ) : (
            <>
              <Play /> {hasStarted ? "Resume" : "Start focus"}
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          <RotateCcw /> Reset
        </Button>
      </div>
    </div>
  );
}
