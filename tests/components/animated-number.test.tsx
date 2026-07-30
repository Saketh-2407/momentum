import { describe, expect, it, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AnimatedNumber } from "@/components/ui/animated-number";

function mockReducedMotion(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  // @ts-expect-error -- restore to avoid leaking into other test files
  delete window.matchMedia;
});

describe("AnimatedNumber", () => {
  it("renders the initial value immediately", () => {
    mockReducedMotion(false);
    render(<AnimatedNumber value={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("animates to a new value when the prop changes", async () => {
    mockReducedMotion(false);
    const { rerender } = render(<AnimatedNumber value={5} />);
    rerender(<AnimatedNumber value={42} />);

    await waitFor(() => expect(screen.getByText("42")).toBeInTheDocument());
  });

  it("jumps instantly to the new value when reduced motion is preferred", async () => {
    mockReducedMotion(true);
    const { rerender } = render(<AnimatedNumber value={5} />);
    rerender(<AnimatedNumber value={42} />);

    await waitFor(() => expect(screen.getByText("42")).toBeInTheDocument());
  });

  it("formats large numbers with locale separators", async () => {
    mockReducedMotion(true);
    const { rerender } = render(<AnimatedNumber value={0} />);
    rerender(<AnimatedNumber value={12345} />);

    await waitFor(() => expect(screen.getByText("12,345")).toBeInTheDocument());
  });
});
