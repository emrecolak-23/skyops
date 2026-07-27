import { test, expect } from "@playwright/test";

const uniqueSuffix = Date.now().toString().slice(-4);
const serial = `SKY-E2E0-${uniqueSuffix}`;
const missionName = `E2E Mission ${uniqueSuffix}`;

test.describe("mission lifecycle", () => {
  test("create drone, plan mission, run through states", async ({ page }) => {
    await page.goto("/drones");
    await page.getByRole("button", { name: "New Drone" }).click();

    await page.getByLabel("Serial Number").fill(serial);
    await page.getByRole("combobox", { name: "Model" }).click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: /register drone/i }).click();

    await expect(page.getByRole("cell", { name: serial })).toBeVisible();

    await page.goto("/missions");
    await page.getByRole("button", { name: "New Mission" }).click();

    await page.getByLabel("Mission Name").fill(missionName);
    await page.getByPlaceholder("Select a drone").click();
    await page.waitForTimeout(500);
    await page.getByRole("option").first().click();
    await page.getByLabel("Pilot Name").fill("E2E Pilot");
    await page.getByLabel("Site Location").fill("E2E Site");

    await page.getByRole("button", { name: /create mission/i }).click();
    await page.waitForURL(/\/missions\/[a-f0-9-]+$/);
    await expect(
      page.getByRole("heading", { name: missionName }),
    ).toBeVisible();

    await expect(page.getByText("PLANNED", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /pre-flight/i }).click();
    await expect(page.getByText("PRE_FLIGHT_CHECK")).toBeVisible();

    await page.getByRole("button", { name: /start mission/i }).click();
    await expect(page.getByText("IN_PROGRESS")).toBeVisible();

    await page.getByRole("button", { name: /^complete$/i }).click();
    await page.getByLabel(/flight hours/i).fill("2.5");
    await page.getByRole("button", { name: /complete mission/i }).click();
    await expect(page.getByTestId("mission-status")).toHaveText("COMPLETED");
    await page.waitForTimeout(500);
  });
});
