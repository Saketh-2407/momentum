"use client";

import { useActionState, useTransition } from "react";
import { motion } from "motion/react";
import { createQuest, logQuestContribution } from "@/app/dashboard/social/actions";
import type { ActionState } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QuestProgress } from "@/lib/social/quest";

const initialState: ActionState = {};

export interface QuestItem {
  id: string;
  title: string;
  progress: QuestProgress;
  members: string[];
}

export function QuestsSection({
  quests,
  friends,
}: {
  quests: QuestItem[];
  friends: { id: string; displayName: string }[];
}) {
  const [state, formAction, pending] = useActionState(createQuest, initialState);
  const [, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-6">
      {friends.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add a friend first to start a co-op quest together.
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="quest-title">Quest title</Label>
              <Input id="quest-title" name="title" placeholder="50 tasks this week" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="quest-target">Target count</Label>
              <Input id="quest-target" name="targetCount" type="number" min={1} defaultValue={20} required />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="quest-friend">Quest with</Label>
            <Select
              name="friendId"
              defaultValue={friends[0]?.id}
              required
              items={friends.map((friend) => ({ value: friend.id, label: friend.displayName }))}
            >
              <SelectTrigger id="quest-friend" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {friends.map((friend) => (
                  <SelectItem key={friend.id} value={friend.id}>
                    {friend.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Starting…" : "Start quest"}
          </Button>
        </form>
      )}

      {quests.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active quests yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {quests.map((quest) => (
            <li key={quest.id} className="flex flex-col gap-2 rounded-lg border border-border/60 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{quest.title}</span>
                <span className="text-xs text-muted-foreground">
                  {quest.progress.completed} / {quest.progress.target}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${quest.progress.percent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{quest.members.join(" & ")}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={quest.progress.isComplete}
                  onClick={() => startTransition(() => logQuestContribution(quest.id))}
                >
                  {quest.progress.isComplete ? "Complete! 🎉" : "+1 progress"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
