import { describe, expect, it } from "vitest";
import { buildAuthorizationUrl, SCOPES } from "@/lib/connectors/google-oauth";

describe("buildAuthorizationUrl", () => {
  it("includes the client id, redirect uri, scope, and state", () => {
    const url = new URL(
      buildAuthorizationUrl({
        clientId: "client-123",
        redirectUri: "https://example.com/callback",
        scope: SCOPES.google_calendar,
        state: "state-abc",
      }),
    );

    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("client-123");
    expect(url.searchParams.get("redirect_uri")).toBe("https://example.com/callback");
    expect(url.searchParams.get("scope")).toBe(SCOPES.google_calendar);
    expect(url.searchParams.get("state")).toBe("state-abc");
  });

  it("requests offline access with forced consent, to guarantee a refresh token", () => {
    const url = new URL(
      buildAuthorizationUrl({
        clientId: "c",
        redirectUri: "https://example.com/callback",
        scope: SCOPES.gmail,
        state: "s",
      }),
    );

    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("response_type")).toBe("code");
  });

  it("defines distinct, narrow scopes per provider", () => {
    expect(SCOPES.google_calendar).toContain("calendar.readonly");
    expect(SCOPES.gmail).toContain("gmail.readonly");
    expect(SCOPES.google_calendar).not.toBe(SCOPES.gmail);
  });
});
