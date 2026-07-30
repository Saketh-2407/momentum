import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FocusTimer } from "@/components/dashboard/focus-timer";

const completeFocusSession = vi.fn();
const showLevelUpToast = vi.fn();

vi.mock("@/app/dashboard/standout/actions", () => ({
  completeFocusSession: (...args: unknown[]) => completeFocusSession(...args),
}));

vi.mock("@/components/gamification/level-up-toast", () => ({
  showLevelUpToast: (...args: unknown[]) => showLevelUpToast(...args),
}));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  completeFocusSession.mockReset();
  completeFocusSession.mockResolvedValue({ xpAwarded: 50, leveledUp: false });
  showLevelUpToast.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("FocusTimer", () => {
  it("shows the default 25-minute duration selected", () => {
    render(<FocusTimer tasks={[]} />);
    expect(screen.getByText("25:00")).toBeInTheDocument();
  });

  it("switches duration before starting", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<FocusTimer tasks={[]} />);

    await user.click(screen.getByRole("button", { name: "15m" }));

    expect(screen.getByText("15:00")).toBeInTheDocument();
  });

  it("counts down once started", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<FocusTimer tasks={[]} />);

    await user.click(screen.getByRole("button", { name: "15m" }));
    await user.click(screen.getByRole("button", { name: /start focus/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(screen.getByText("14:57")).toBeInTheDocument();
  });

  it("completes the session, awards XP, and disables further starts", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<FocusTimer tasks={[{ id: "t1", title: "Write report" }]} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Write report" }));
    await user.click(screen.getByRole("button", { name: "15m" }));
    await user.click(screen.getByRole("button", { name: /start focus/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15 * 60 * 1000);
    });

    expect(completeFocusSession).toHaveBeenCalledWith(15, "t1");
    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /session complete/i })).toBeDisabled();
  });

  it("resets back to the selected duration", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<FocusTimer tasks={[]} />);

    await user.click(screen.getByRole("button", { name: "15m" }));
    await user.click(screen.getByRole("button", { name: /start focus/i }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await user.click(screen.getByRole("button", { name: /reset/i }));

    expect(screen.getByText("15:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start focus/i })).toBeInTheDocument();
  });
});
