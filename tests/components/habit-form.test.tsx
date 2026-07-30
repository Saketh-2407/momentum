import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HabitForm } from "@/components/habits/habit-form";

const createHabit = vi.fn();

vi.mock("@/app/dashboard/actions", () => ({
  createHabit: (...args: unknown[]) => createHabit(...args),
}));

beforeEach(() => {
  createHabit.mockReset();
});

describe("HabitForm", () => {
  it("only shows weekday pickers after switching to 'specific days'", async () => {
    const user = userEvent.setup();
    render(<HabitForm />);

    expect(screen.queryByRole("radiogroup", { name: /cadence/i })).toBeInTheDocument();
    expect(screen.queryByText("M")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /specific days/i }));

    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("surfaces the error returned by the server action", async () => {
    createHabit.mockResolvedValue({ error: "Title is required." });
    const user = userEvent.setup();
    render(<HabitForm />);

    // A single space passes the native `required` check but is rejected as
    // empty by the server action, which is what we're testing here.
    await user.type(screen.getByLabelText(/new habit/i), " ");
    await user.click(screen.getByRole("button", { name: /add habit/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/title is required/i);
  });

  it("resets the form after a successful submission", async () => {
    createHabit.mockResolvedValue({});
    const user = userEvent.setup();
    render(<HabitForm />);

    const titleInput = screen.getByLabelText(/new habit/i) as HTMLInputElement;
    await user.type(titleInput, "Read 20 minutes");
    await user.click(screen.getByRole("button", { name: /add habit/i }));

    await waitFor(() => expect(titleInput.value).toBe(""));
  });
});
