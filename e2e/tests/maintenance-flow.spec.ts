import { test, expect } from "@playwright/test";

const uniqueSuffix = Date.now().toString().slice(-4);
const serial = `SKY-MNT0-${uniqueSuffix}`;

test.describe("maintenance flow", () => {
  test("create drone, open and complete maintenance", async ({ page }) => {
    await page.goto("/drones");
    await page.getByRole("button", { name: "New Drone" }).click();
    await page.getByLabel("Serial Number").fill(serial);
    await page.getByRole("combobox", { name: "Model" }).click();
    await page.waitForTimeout(500);
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: /register drone/i }).click();

    await page.waitForURL(/\/drones\/[a-f0-9-]+$/);
    await expect(page.getByTestId("drone-status")).toHaveText("AVAILABLE");

    await page.getByRole("button", { name: /start maintenance/i }).click();

    const modal = page.getByRole("dialog");
    await modal.getByLabel("Technician Name").fill("E2E Tech");
    await modal.getByRole("button", { name: /start maintenance/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await expect(page.getByTestId("drone-status")).toHaveText("MAINTENANCE", {
      timeout: 1000,
    });

    await page.getByRole("button", { name: /complete maintenance/i }).click();

    await page.getByRole("button", { name: /^complete$/i }).click();

    await expect(page.getByTestId("drone-status")).toHaveText("AVAILABLE");
  });
});
