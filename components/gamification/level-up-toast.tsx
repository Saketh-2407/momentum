import { toast } from "sonner";
import { Trophy } from "lucide-react";

export function showLevelUpToast(level: number) {
  toast(`Level ${level}!`, {
    description: "You leveled up. Keep the momentum going.",
    icon: <Trophy className="size-4 text-warning" />,
  });
}
