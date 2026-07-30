import { describe, expect, it } from "vitest";
import { mapGmailMessage } from "@/lib/connectors/gmail";

describe("mapGmailMessage", () => {
  it("extracts subject, snippet, and from", () => {
    const result = mapGmailMessage({
      id: "msg-1",
      snippet: "Can you send over the...",
      payload: {
        headers: [
          { name: "Subject", value: "Contract review" },
          { name: "From", value: "landlord@example.com" },
        ],
      },
    });
    expect(result).toEqual({
      id: "msg-1",
      subject: "Contract review",
      snippet: "Can you send over the...",
      from: "landlord@example.com",
    });
  });

  it("is case-insensitive when matching header names", () => {
    const result = mapGmailMessage({
      id: "msg-2",
      payload: { headers: [{ name: "subject", value: "lowercase header" }] },
    });
    expect(result.subject).toBe("lowercase header");
  });

  it("falls back gracefully when subject is missing", () => {
    const result = mapGmailMessage({ id: "msg-3", payload: { headers: [] } });
    expect(result.subject).toBe("(no subject)");
  });

  it("handles a completely empty payload", () => {
    const result = mapGmailMessage({ id: "msg-4" });
    expect(result).toEqual({ id: "msg-4", subject: "(no subject)", snippet: "", from: "" });
  });
});
