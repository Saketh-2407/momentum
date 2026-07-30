import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FriendsSection } from "@/components/social/friends-section";

const sendFriendRequest = vi.fn();
const respondToFriendRequest = vi.fn();
const removeFriendship = vi.fn();

vi.mock("@/app/dashboard/social/actions", () => ({
  sendFriendRequest: (...args: unknown[]) => sendFriendRequest(...args),
  respondToFriendRequest: (...args: unknown[]) => respondToFriendRequest(...args),
  removeFriendship: (...args: unknown[]) => removeFriendship(...args),
}));

beforeEach(() => {
  sendFriendRequest.mockReset();
  sendFriendRequest.mockResolvedValue({});
  respondToFriendRequest.mockReset();
  removeFriendship.mockReset();
});

describe("FriendsSection", () => {
  it("shows an empty state with no friends", () => {
    render(<FriendsSection incoming={[]} outgoing={[]} accepted={[]} />);
    expect(screen.getByText(/no friends yet/i)).toBeInTheDocument();
  });

  it("sends a friend request", async () => {
    const user = userEvent.setup();
    render(<FriendsSection incoming={[]} outgoing={[]} accepted={[]} />);

    await user.type(screen.getByLabelText(/add a friend/i), "friend@example.com");
    await user.click(screen.getByRole("button", { name: /send request/i }));

    await waitFor(() => expect(sendFriendRequest).toHaveBeenCalled());
  });

  it("accepts an incoming request", async () => {
    const user = userEvent.setup();
    render(
      <FriendsSection
        incoming={[{ friendshipId: "f1", displayName: "Alice" }]}
        outgoing={[]}
        accepted={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /accept alice/i }));

    await waitFor(() => expect(respondToFriendRequest).toHaveBeenCalledWith("f1", true));
  });

  it("declines an incoming request", async () => {
    const user = userEvent.setup();
    render(
      <FriendsSection
        incoming={[{ friendshipId: "f1", displayName: "Alice" }]}
        outgoing={[]}
        accepted={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /decline alice/i }));

    await waitFor(() => expect(respondToFriendRequest).toHaveBeenCalledWith("f1", false));
  });

  it("cancels an outgoing request", async () => {
    const user = userEvent.setup();
    render(
      <FriendsSection
        incoming={[]}
        outgoing={[{ friendshipId: "f2", displayName: "Bob" }]}
        accepted={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => expect(removeFriendship).toHaveBeenCalledWith("f2"));
  });

  it("removes an accepted friend", async () => {
    const user = userEvent.setup();
    render(
      <FriendsSection
        incoming={[]}
        outgoing={[]}
        accepted={[{ friendshipId: "f3", displayName: "Carol" }]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /remove carol/i }));

    await waitFor(() => expect(removeFriendship).toHaveBeenCalledWith("f3"));
  });
});
