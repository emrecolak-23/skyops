import { test, expect } from "@playwright/test";

test("dashboard loads and shows fleet overview", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Fleet Overview" }),
  ).toBeVisible();
  await expect(page.getByText("Available")).toBeVisible();
});
