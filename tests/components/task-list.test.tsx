import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskList } from "@/components/tasks/task-list";
import type { Database } from "@/lib/supabase/database.types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

const setTaskStatus = vi.fn();
const deleteTask = vi.fn();

vi.mock("@/app/dashboard/actions", () => ({
  setTaskStatus: (...args: unknown[]) => setTaskStatus(...args),
  deleteTask: (...args: unknown[]) => deleteTask(...args),
}));

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    user_id: "user-1",
    title: "Write the report",
    notes: null,
    category: null,
    scheduled_at: null,
    deadline: null,
    importance: 3,
    effort: 3,
    status: "todo",
    completed_at: null,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  setTaskStatus.mockReset();
  deleteTask.mockReset();
});

describe("TaskList", () => {
  it("shows an empty state with no tasks", () => {
    render(<TaskList tasks={[]} />);
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it("splits scheduled and unscheduled tasks into separate groups, sorted by time", () => {
    const tasks = [
      makeTask({ id: "b", title: "Later task", scheduled_at: "2026-03-05T15:00:00Z" }),
      makeTask({ id: "a", title: "Earlier task", scheduled_at: "2026-03-05T09:00:00Z" }),
      makeTask({ id: "c", title: "No time task", scheduled_at: null }),
    ];
    render(<TaskList tasks={tasks} />);

    const items = screen.getAllByRole("listitem").map((el) => el.textContent);
    expect(items[0]).toContain("Earlier task");
    expect(items[1]).toContain("Later task");
    expect(items[2]).toContain("No time task");
  });

  it("marks a task done via checkbox", async () => {
    const user = userEvent.setup();
    render(<TaskList tasks={[makeTask()]} />);

    await user.click(screen.getByRole("checkbox"));

    await waitFor(() => expect(setTaskStatus).toHaveBeenCalledWith("task-1", "done"));
  });

  it("deletes a task", async () => {
    const user = userEvent.setup();
    render(<TaskList tasks={[makeTask()]} />);

    await user.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => expect(deleteTask).toHaveBeenCalledWith("task-1"));
  });
});
