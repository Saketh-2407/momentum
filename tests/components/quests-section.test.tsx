import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestsSection } from "@/components/social/quests-section";

const createQuest = vi.fn();
const logQuestContribution = vi.fn();

vi.mock("@/app/dashboard/social/actions", () => ({
  createQuest: (...args: unknown[]) => createQuest(...args),
  logQuestContribution: (...args: unknown[]) => logQuestContribution(...args),
}));

beforeEach(() => {
  createQuest.mockReset();
  createQuest.mockResolvedValue({});
  logQuestContribution.mockReset();
});

describe("QuestsSection", () => {
  it("prompts to add a friend first when there are none", () => {
    render(<QuestsSection quests={[]} friends={[]} />);
    expect(screen.getByText(/add a friend first/i)).toBeInTheDocument();
  });

  it("shows an empty state with no quests", () => {
    render(<QuestsSection quests={[]} friends={[{ id: "u1", displayName: "Alice" }]} />);
    expect(screen.getByText(/no active quests/i)).toBeInTheDocument();
  });

  it("logs a contribution", async () => {
    const user = userEvent.setup();
    render(
      <QuestsSection
        quests={[
          {
            id: "q1",
            title: "50 tasks",
            progress: { completed: 5, target: 50, percent: 10, isComplete: false },
            members: ["Alice", "You"],
          },
        ]}
        friends={[{ id: "u1", displayName: "Alice" }]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /\+1 progress/i }));

    await waitFor(() => expect(logQuestContribution).toHaveBeenCalledWith("q1"));
  });

  it("disables the contribute button once the quest is complete", () => {
    render(
      <QuestsSection
        quests={[
          {
            id: "q1",
            title: "50 tasks",
            progress: { completed: 50, target: 50, percent: 100, isComplete: true },
            members: ["Alice", "You"],
          },
        ]}
        friends={[{ id: "u1", displayName: "Alice" }]}
      />,
    );

    expect(screen.getByRole("button", { name: /complete/i })).toBeDisabled();
  });

  it("starts a new quest", async () => {
    const user = userEvent.setup();
    render(<QuestsSection quests={[]} friends={[{ id: "u1", displayName: "Alice" }]} />);

    await user.type(screen.getByLabelText(/quest title/i), "50 tasks this week");
    await user.click(screen.getByRole("button", { name: /start quest/i }));

    await waitFor(() => expect(createQuest).toHaveBeenCalled());
  });
});
