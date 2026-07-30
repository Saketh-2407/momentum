import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskForm } from "@/components/tasks/task-form";

const createTask = vi.fn();

vi.mock("@/app/dashboard/actions", () => ({
  createTask: (...args: unknown[]) => createTask(...args),
}));

beforeEach(() => {
  createTask.mockReset();
});

describe("TaskForm", () => {
  it("shows the error returned by the server action", async () => {
    createTask.mockResolvedValue({ error: "Title is required." });
    const user = userEvent.setup();
    render(<TaskForm />);

    // A single space passes the native `required` check but is rejected as
    // empty by the server action, which is what we're testing here.
    await user.type(screen.getByLabelText(/new task/i), " ");
    await user.click(screen.getByRole("button", { name: /add task/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/title is required/i);
  });

  it("resets the form after a successful submission", async () => {
    createTask.mockResolvedValue({});
    const user = userEvent.setup();
    render(<TaskForm />);

    const titleInput = screen.getByLabelText(/new task/i) as HTMLInputElement;
    await user.type(titleInput, "Write the report");
    await user.click(screen.getByRole("button", { name: /add task/i }));

    await waitFor(() => expect(titleInput.value).toBe(""));
  });

  it("defaults importance and effort to Medium", () => {
    render(<TaskForm />);
    const comboboxes = screen.getAllByRole("combobox");
    expect(comboboxes[0]).toHaveTextContent("Medium");
    expect(comboboxes[1]).toHaveTextContent("Medium");
  });

  it("submits the numeric value (5) for a High importance/effort selection, not the label", async () => {
    createTask.mockResolvedValue({});
    const user = userEvent.setup();
    render(<TaskForm />);

    await user.type(screen.getByLabelText(/new task/i), "Write the report");

    const [importanceTrigger, effortTrigger] = screen.getAllByRole("combobox");
    await user.click(importanceTrigger);
    await user.click(await screen.findByRole("option", { name: "High" }));
    await user.click(effortTrigger);
    await user.click(await screen.findByRole("option", { name: "Low" }));

    await user.click(screen.getByRole("button", { name: /add task/i }));

    await waitFor(() => expect(createTask).toHaveBeenCalled());
    const formData = createTask.mock.calls[0][1] as FormData;
    expect(formData.get("importance")).toBe("5");
    expect(formData.get("effort")).toBe("1");
  });
});
