import { describe, expect, it } from "vitest";
import { isProtectedPath, isAuthOnlyPath } from "@/lib/auth/protected-routes";

describe("isProtectedPath", () => {
  it("protects the dashboard root", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
  });

  it("protects nested dashboard routes", () => {
    expect(isProtectedPath("/dashboard/settings")).toBe(true);
  });

  it("does not protect the marketing home page", () => {
    expect(isProtectedPath("/")).toBe(false);
  });

  it("does not protect unrelated routes", () => {
    expect(isProtectedPath("/login")).toBe(false);
  });

  it("does not treat a similarly-prefixed path as protected", () => {
    expect(isProtectedPath("/dashboards")).toBe(false);
  });

  it("handles an empty path", () => {
    expect(isProtectedPath("")).toBe(false);
  });
});

describe("isAuthOnlyPath", () => {
  it("flags the login page", () => {
    expect(isAuthOnlyPath("/login")).toBe(true);
  });

  it("flags the signup page", () => {
    expect(isAuthOnlyPath("/signup")).toBe(true);
  });

  it("does not flag the dashboard", () => {
    expect(isAuthOnlyPath("/dashboard")).toBe(false);
  });

  it("does not flag nested auth-like paths", () => {
    expect(isAuthOnlyPath("/login/forgot-password")).toBe(false);
  });
});
