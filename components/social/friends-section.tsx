"use client";

import { useActionState, useTransition } from "react";
import { Check, X, UserMinus } from "lucide-react";
import {
  sendFriendRequest,
  respondToFriendRequest,
  removeFriendship,
} from "@/app/dashboard/social/actions";
import type { ActionState } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface FriendEntry {
  friendshipId: string;
  displayName: string;
}

const initialState: ActionState = {};

export function FriendsSection({
  incoming,
  outgoing,
  accepted,
}: {
  incoming: FriendEntry[];
  outgoing: FriendEntry[];
  accepted: FriendEntry[];
}) {
  const [state, formAction, pending] = useActionState(sendFriendRequest, initialState);
  const [, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="friend-email">Add a friend by email</Label>
          <Input id="friend-email" name="email" type="email" placeholder="friend@example.com" required />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send request"}
        </Button>
      </form>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      {incoming.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Requests
          </p>
          <ul className="flex flex-col gap-2">
            {incoming.map((f) => (
              <li
                key={f.friendshipId}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
              >
                <span className="text-sm">{f.displayName}</span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon-sm"
                    aria-label={`Accept ${f.displayName}`}
                    onClick={() => startTransition(() => respondToFriendRequest(f.friendshipId, true))}
                  >
                    <Check />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Decline ${f.displayName}`}
                    onClick={() => startTransition(() => respondToFriendRequest(f.friendshipId, false))}
                  >
                    <X />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {outgoing.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pending
          </p>
          <ul className="flex flex-col gap-2">
            {outgoing.map((f) => (
              <li
                key={f.friendshipId}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
              >
                <span className="text-sm text-muted-foreground">{f.displayName}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => startTransition(() => removeFriendship(f.friendshipId))}
                >
                  Cancel
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Your friends
        </p>
        {accepted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No friends yet — send a request above.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {accepted.map((f) => (
              <li
                key={f.friendshipId}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
              >
                <span className="text-sm">{f.displayName}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${f.displayName}`}
                  onClick={() => startTransition(() => removeFriendship(f.friendshipId))}
                >
                  <UserMinus />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
