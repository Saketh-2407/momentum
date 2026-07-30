import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlannerCard } from "@/components/planner/planner-card";

const commitPlanItems = vi.fn();

vi.mock("@/app/dashboard/actions", () => ({
  commitPlanItems: (...args: unknown[]) => commitPlanItems(...args),
}));

const samplePlan = {
  plan: {
    items: [
      {
        title: "Reply to landlord",
        notes: null,
        importance: 4,
        effort: 2,
        energy: "medium",
        deadline: null,
        dependsOnTitle: null,
        rationale: "due soon",
        score: 42,
        suggestedScheduledAt: "2026-03-05T09:00:00.000Z",
      },
    ],
  },
};

beforeEach(() => {
  commitPlanItems.mockReset();
  commitPlanItems.mockResolvedValue({});
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      json: async () => samplePlan,
    })),
  );
});

describe("PlannerCard", () => {
  it("disables generate until there is input", () => {
    render(<PlannerCard />);
    expect(screen.getByRole("button", { name: /generate plan/i })).toBeDisabled();
  });

  it("generates and shows a review list", async () => {
    const user = userEvent.setup();
    render(<PlannerCard />);

    await user.type(screen.getByPlaceholderText(/dump everything/i), "reply to landlord");
    await user.click(screen.getByRole("button", { name: /generate plan/i }));

    expect(await screen.findByDisplayValue("Reply to landlord")).toBeInTheDocument();
    expect(screen.getByText("due soon")).toBeInTheDocument();
  });

  it("shows an error message when the API returns one", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ json: async () => ({ error: "Brain dump too long." }) })),
    );
    const user = userEvent.setup();
    render(<PlannerCard />);

    await user.type(screen.getByPlaceholderText(/dump everything/i), "x".repeat(20));
    await user.click(screen.getByRole("button", { name: /generate plan/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/too long/i);
  });

  it("removes an item from the review list", async () => {
    const user = userEvent.setup();
    render(<PlannerCard />);

    await user.type(screen.getByPlaceholderText(/dump everything/i), "reply to landlord");
    await user.click(screen.getByRole("button", { name: /generate plan/i }));
    await screen.findByDisplayValue("Reply to landlord");

    await user.click(screen.getByRole("button", { name: /remove/i }));

    expect(screen.queryByDisplayValue("Reply to landlord")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /accept & add 0/i })).toBeDisabled();
  });

  it("commits accepted items and returns to the input stage", async () => {
    const user = userEvent.setup();
    render(<PlannerCard />);

    await user.type(screen.getByPlaceholderText(/dump everything/i), "reply to landlord");
    await user.click(screen.getByRole("button", { name: /generate plan/i }));
    await screen.findByDisplayValue("Reply to landlord");

    await user.click(screen.getByRole("button", { name: /accept & add 1/i }));

    await waitFor(() => expect(commitPlanItems).toHaveBeenCalledTimes(1));
    expect(commitPlanItems).toHaveBeenCalledWith([
      expect.objectContaining({ title: "Reply to landlord", importance: 4, effort: 2 }),
    ]);
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/dump everything/i)).toBeInTheDocument(),
    );
  });
});
