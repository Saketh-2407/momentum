import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConnectorCard } from "@/components/settings/connector-card";

const disconnectProvider = vi.fn();
const syncCalendar = vi.fn();
const syncGmail = vi.fn();

vi.mock("@/app/dashboard/settings/actions", () => ({
  disconnectProvider: (...args: unknown[]) => disconnectProvider(...args),
  syncCalendar: (...args: unknown[]) => syncCalendar(...args),
  syncGmail: (...args: unknown[]) => syncGmail(...args),
}));

beforeEach(() => {
  disconnectProvider.mockReset();
  syncCalendar.mockReset();
  syncCalendar.mockResolvedValue({});
  syncGmail.mockReset();
  syncGmail.mockResolvedValue({});
});

describe("ConnectorCard", () => {
  it("shows a connect link when not connected", () => {
    render(
      <ConnectorCard
        provider="google_calendar"
        connected={false}
        lastSyncedAt={null}
        description="desc"
      />,
    );
    const link = screen.getByRole("link", { name: /connect google calendar/i });
    expect(link).toHaveAttribute("href", "/api/connectors/google/authorize?provider=google_calendar");
  });

  it("syncs calendar when connected", async () => {
    const user = userEvent.setup();
    render(
      <ConnectorCard provider="google_calendar" connected lastSyncedAt={null} description="desc" />,
    );

    await user.click(screen.getByRole("button", { name: /sync now/i }));

    await waitFor(() => expect(syncCalendar).toHaveBeenCalled());
    expect(syncGmail).not.toHaveBeenCalled();
  });

  it("syncs gmail (not calendar) when the provider is gmail", async () => {
    const user = userEvent.setup();
    render(<ConnectorCard provider="gmail" connected lastSyncedAt={null} description="desc" />);

    await user.click(screen.getByRole("button", { name: /sync now/i }));

    await waitFor(() => expect(syncGmail).toHaveBeenCalled());
    expect(syncCalendar).not.toHaveBeenCalled();
  });

  it("disconnects", async () => {
    const user = userEvent.setup();
    render(<ConnectorCard provider="gmail" connected lastSyncedAt={null} description="desc" />);

    await user.click(screen.getByRole("button", { name: /disconnect/i }));

    await waitFor(() => expect(disconnectProvider).toHaveBeenCalledWith("gmail"));
  });
});
