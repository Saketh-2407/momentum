import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuggestedTasksList } from "@/components/settings/suggested-tasks-list";
import type { Database } from "@/lib/supabase/database.types";

type SuggestedTask = Database["public"]["Tables"]["suggested_tasks"]["Row"];

const acceptSuggestedTask = vi.fn();
const dismissSuggestedTask = vi.fn();

vi.mock("@/app/dashboard/settings/actions", () => ({
  acceptSuggestedTask: (...args: unknown[]) => acceptSuggestedTask(...args),
  dismissSuggestedTask: (...args: unknown[]) => dismissSuggestedTask(...args),
}));

function makeSuggestion(overrides: Partial<SuggestedTask> = {}): SuggestedTask {
  return {
    id: "s1",
    user_id: "u1",
    source_type: "gmail",
    source_ref: "msg-1",
    title: "Reply to landlord",
    notes: null,
    suggested_deadline: null,
    status: "pending",
    created_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  acceptSuggestedTask.mockReset();
  acceptSuggestedTask.mockResolvedValue({});
  dismissSuggestedTask.mockReset();
});

describe("SuggestedTasksList", () => {
  it("shows an empty state with no suggestions", () => {
    render(<SuggestedTasksList suggestions={[]} />);
    expect(screen.getByText(/no suggestions right now/i)).toBeInTheDocument();
  });

  it("accepts a suggestion with its (possibly edited) title", async () => {
    const user = userEvent.setup();
    render(<SuggestedTasksList suggestions={[makeSuggestion()]} />);

    const input = screen.getByLabelText(/suggested task title/i);
    await user.clear(input);
    await user.type(input, "Reply to landlord about lease");
    await user.click(screen.getByRole("button", { name: /accept/i }));

    await waitFor(() =>
      expect(acceptSuggestedTask).toHaveBeenCalledWith("s1", "Reply to landlord about lease"),
    );
  });

  it("dismisses a suggestion", async () => {
    const user = userEvent.setup();
    render(<SuggestedTasksList suggestions={[makeSuggestion()]} />);

    await user.click(screen.getByRole("button", { name: /dismiss/i }));

    await waitFor(() => expect(dismissSuggestedTask).toHaveBeenCalledWith("s1"));
  });
});
