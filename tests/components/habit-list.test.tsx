import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HabitList, type HabitListItem } from "@/components/habits/habit-list";

const setHabitCompletedToday = vi.fn();
const deleteHabit = vi.fn();

vi.mock("@/app/dashboard/actions", () => ({
  setHabitCompletedToday: (...args: unknown[]) => setHabitCompletedToday(...args),
  deleteHabit: (...args: unknown[]) => deleteHabit(...args),
}));

function makeHabit(overrides: Partial<HabitListItem> = {}): HabitListItem {
  return {
    id: "habit-1",
    title: "Read 20 minutes",
    cadenceLabel: "Every day",
    currentStreak: 0,
    bestStreak: 0,
    completedToday: false,
    ...overrides,
  };
}

beforeEach(() => {
  setHabitCompletedToday.mockReset();
  deleteHabit.mockReset();
});

describe("HabitList", () => {
  it("shows an empty state with no habits", () => {
    render(<HabitList habits={[]} />);
    expect(screen.getByText(/no habits yet/i)).toBeInTheDocument();
  });

  it("shows the current streak when greater than zero", () => {
    render(<HabitList habits={[makeHabit({ currentStreak: 5 })]} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("hides the streak badge at zero", () => {
    render(<HabitList habits={[makeHabit({ currentStreak: 0 })]} />);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("marks a habit done for today via checkbox", async () => {
    const user = userEvent.setup();
    render(<HabitList habits={[makeHabit()]} />);

    await user.click(screen.getByRole("checkbox"));

    await waitFor(() =>
      expect(setHabitCompletedToday).toHaveBeenCalledWith("habit-1", true),
    );
  });

  it("deletes a habit", async () => {
    const user = userEvent.setup();
    render(<HabitList habits={[makeHabit()]} />);

    await user.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => expect(deleteHabit).toHaveBeenCalledWith("habit-1"));
  });
});
