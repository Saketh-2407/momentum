import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkbooksSection } from "@/components/social/workbooks-section";
import type { Database } from "@/lib/supabase/database.types";

type Workbook = Database["public"]["Tables"]["workbooks"]["Row"];

const publishWorkbookFromSelection = vi.fn();
const setWorkbookPublished = vi.fn();
const deleteWorkbook = vi.fn();
const cloneWorkbook = vi.fn();

vi.mock("@/app/dashboard/social/actions", () => ({
  publishWorkbookFromSelection: (...args: unknown[]) => publishWorkbookFromSelection(...args),
  setWorkbookPublished: (...args: unknown[]) => setWorkbookPublished(...args),
  deleteWorkbook: (...args: unknown[]) => deleteWorkbook(...args),
  cloneWorkbook: (...args: unknown[]) => cloneWorkbook(...args),
}));

function makeWorkbook(overrides: Partial<Workbook> = {}): Workbook {
  return {
    id: "wb-1",
    user_id: "owner-1",
    title: "Morning Reset",
    description: null,
    is_published: true,
    owner_display_name: "Alice",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  publishWorkbookFromSelection.mockReset();
  publishWorkbookFromSelection.mockResolvedValue({});
  setWorkbookPublished.mockReset();
  deleteWorkbook.mockReset();
  cloneWorkbook.mockReset();
});

describe("WorkbooksSection", () => {
  it("shows a prompt to add tasks/habits when there are none to bundle", () => {
    render(<WorkbooksSection myWorkbooks={[]} browseWorkbooks={[]} tasks={[]} habits={[]} />);
    expect(screen.getByText(/add some tasks or habits first/i)).toBeInTheDocument();
  });

  it("clones a browsed workbook and shows success", async () => {
    cloneWorkbook.mockResolvedValue({});
    const user = userEvent.setup();
    render(
      <WorkbooksSection
        myWorkbooks={[]}
        browseWorkbooks={[makeWorkbook()]}
        tasks={[]}
        habits={[]}
      />,
    );

    expect(screen.getByText(/by alice/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /clone/i }));

    await waitFor(() => expect(cloneWorkbook).toHaveBeenCalledWith("wb-1"));
  });

  it("toggles publish state for one of my workbooks", async () => {
    const user = userEvent.setup();
    render(
      <WorkbooksSection
        myWorkbooks={[makeWorkbook({ user_id: "me", is_published: false })]}
        browseWorkbooks={[]}
        tasks={[]}
        habits={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^publish$/i }));

    await waitFor(() => expect(setWorkbookPublished).toHaveBeenCalledWith("wb-1", true));
  });

  it("deletes one of my workbooks", async () => {
    const user = userEvent.setup();
    render(
      <WorkbooksSection
        myWorkbooks={[makeWorkbook({ user_id: "me" })]}
        browseWorkbooks={[]}
        tasks={[]}
        habits={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => expect(deleteWorkbook).toHaveBeenCalledWith("wb-1"));
  });
});
