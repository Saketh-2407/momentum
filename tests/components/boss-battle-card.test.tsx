import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { BossBattleCard } from "@/components/dashboard/boss-battle-card";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

beforeEach(() => {
  vi.mocked(toast).mockClear();
});

describe("BossBattleCard", () => {
  it("shows in-progress copy and stats", () => {
    render(
      <BossBattleCard
        battle={{
          target: 15,
          bonusXp: 200,
          completed: 6,
          percent: 40,
          isComplete: false,
          claimed: false,
          justClaimed: false,
        }}
      />,
    );
    expect(screen.getByText("This week's boss")).toBeInTheDocument();
    expect(screen.getByText(/6 \/ 15 tasks/)).toBeInTheDocument();
  });

  it("shows a defeated state and does not toast when already claimed", () => {
    render(
      <BossBattleCard
        battle={{
          target: 15,
          bonusXp: 200,
          completed: 15,
          percent: 100,
          isComplete: true,
          claimed: true,
          justClaimed: false,
        }}
      />,
    );
    expect(screen.getByText("Boss defeated")).toBeInTheDocument();
    expect(toast).not.toHaveBeenCalled();
  });

  it("toasts a celebration exactly when justClaimed is true", () => {
    render(
      <BossBattleCard
        battle={{
          target: 15,
          bonusXp: 200,
          completed: 15,
          percent: 100,
          isComplete: true,
          claimed: true,
          justClaimed: true,
        }}
      />,
    );
    expect(toast).toHaveBeenCalledWith(
      expect.stringContaining("+200 XP"),
      expect.any(Object),
    );
  });
});
