import { test, expect } from "@playwright/test";

test("home page renders the Momentum landing page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "to-do list into a game",
  );
  await expect(page.getByRole("link", { name: "Get started" })).toBeVisible();
});

test("visiting the dashboard while signed out redirects to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("visiting login while signed out shows the login form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
});
