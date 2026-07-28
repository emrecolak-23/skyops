import { test, expect, Page } from "@playwright/test";

function uniqueId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

async function registerDrone(page: Page, serial: string) {
  await page.goto("/drones");
  await page.getByRole("button", { name: "New Drone" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Serial Number").fill(serial);
  await dialog.getByRole("combobox", { name: "Model" }).click();
  await page.getByRole("option").first().click();
  await dialog.getByRole("button", { name: /register drone/i }).click();

  await expect(dialog).not.toBeVisible({ timeout: 10_000 });
  await page.waitForURL(/\/drones\/[a-f0-9-]+$/);
  await expect(page.getByTestId("drone-status")).toHaveText("AVAILABLE");
  return page.url().split("/").pop()!;
}

async function createMissionForDrone(
  page: Page,
  serial: string,
  name: string,
): Promise<string> {
  await page.goto("/missions");
  await page.getByRole("button", { name: "New Mission" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Mission Name").fill(name);
  await dialog.getByPlaceholder("Select a drone").click();
  await page.getByRole("option", { name: new RegExp(serial) }).click();
  await dialog.getByLabel("Pilot Name").fill("E2E Pilot");
  await dialog.getByLabel("Site Location").fill("E2E Site");
  await dialog.getByRole("button", { name: /create mission/i }).click();

  await page.waitForURL(/\/missions\/[a-f0-9-]+$/);
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByTestId("mission-status")).toHaveText("PLANNED");
  return page.url();
}

test.describe("mission reschedule", () => {
  test("shifts the window with +1 day and persists it", async ({ page }) => {
    const suffix = Date.now().toString().slice(-4);
    const serialA = `SKY-RSA0-${suffix}`;
    const missionName = `Reschedule E2E ${serialA}`;

    await registerDrone(page, serialA);
    await createMissionForDrone(page, serialA, missionName);

    const beforeStart = await page
      .getByText("Planned Start")
      .locator("..")
      .getByText(/\d/)
      .first()
      .textContent();

    await page.getByRole("button", { name: /^reschedule$/i }).click();
    const modal = page.getByRole("dialog");
    await expect(modal.getByText("Reschedule Mission")).toBeVisible();

    await expect(
      modal.getByRole("button", { name: /^reset$/i }),
    ).toBeDisabled();
    await expect(
      modal.getByRole("button", { name: /save changes/i }),
    ).toBeDisabled();

    await modal.getByRole("button", { name: "+1 day" }).click();
    await expect(modal.getByText(/\+1d from original/)).toBeVisible();
    await expect(modal.getByRole("button", { name: /^reset$/i })).toBeEnabled();

    await modal.getByRole("button", { name: /^reset$/i }).click();
    await expect(modal.getByText(/\+1d from original/)).toHaveCount(0);
    await expect(
      modal.getByRole("button", { name: /^reset$/i }),
    ).toBeDisabled();

    await modal.getByRole("button", { name: "+1 day" }).click();
    await modal.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    const afterStart = await page
      .getByText("Planned Start")
      .locator("..")
      .getByText(/\d/)
      .first()
      .textContent();
    expect(afterStart).not.toBe(beforeStart);
  });

  test("reassigns to another drone when the original goes into maintenance", async ({
    page,
  }) => {
    const suffix = Date.now().toString().slice(-4);
    const serialA = `SKY-RSA0-${suffix}`;
    const serialB = `SKY-RSB0-${(Number(suffix) + 1).toString().slice(-4).padStart(4, "0")}`;
    const missionName = `Reschedule maint ${serialB}`;

    const droneAId = await registerDrone(page, serialA);
    await registerDrone(page, serialB);
    const missionUrl = await createMissionForDrone(page, serialA, missionName);

    await page.getByRole("button", { name: /pre-flight/i }).click();
    await expect(page.getByTestId("mission-status")).toHaveText(
      "PRE_FLIGHT_CHECK",
    );

    await page.goto(`/drones/${droneAId}`);
    await expect(page.getByTestId("drone-status")).toHaveText("AVAILABLE");
    await page.getByRole("button", { name: /start maintenance/i }).click();
    const maintModal = page.getByRole("dialog");
    await maintModal.getByLabel("Technician Name").fill("E2E Tech");
    await maintModal
      .getByRole("button", { name: /start maintenance/i })
      .click();
    await expect(page.getByTestId("drone-status")).toHaveText("MAINTENANCE");

    await page.goto(missionUrl);

    await expect(page.getByText("This mission cannot start yet")).toBeVisible();
    await expect(page.getByText(/in maintenance/i)).toBeVisible();

    await page.getByRole("button", { name: /start mission/i }).click();
    await expect(
      page.getByText(/not available|maintenance/i).first(),
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("mission-status")).toHaveText(
      "PRE_FLIGHT_CHECK",
    );

    await page.getByRole("button", { name: /^reschedule$/i }).click();
    const modal = page.getByRole("dialog");
    await expect(modal.getByText("Drone unavailable")).toBeVisible();
    await expect(
      modal.getByRole("button", { name: /save changes/i }),
    ).toBeDisabled();

    await modal.getByRole("combobox", { name: /^drone$/i }).click();
    await page.getByRole("option", { name: new RegExp(serialB) }).click();
    await expect(modal.getByText("Drone unavailable")).toHaveCount(0);
    await modal.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await expect(page.getByRole("link", { name: serialB })).toBeVisible();
    await expect(page.getByText("This mission cannot start yet")).toHaveCount(
      0,
    );

    await page.getByRole("button", { name: /start mission/i }).click();
    await expect(page.getByTestId("mission-status")).toHaveText("IN_PROGRESS");
  });
});
