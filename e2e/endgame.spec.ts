import { test, expect } from "@playwright/test";

test.describe("Endgame Trainer", () => {
  test("loads with header and position cards", async ({ page }) => {
    await page.goto("/train/endgame");

    // Header should show
    await expect(page.locator("header").getByText("Endgame Trainer")).toBeVisible();

    // Should have Start Training buttons (one per card)
    const startButtons = page.getByRole("button", { name: /start training/i });
    const count = await startButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("filter by difficulty works", async ({ page }) => {
    await page.goto("/train/endgame");

    // Filter buttons
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Beginner" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Intermediate" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Advanced" })).toBeVisible();

    // Click Beginner filter
    await page.getByRole("button", { name: "Beginner" }).click();

    // Should still have Start Training buttons
    const startButtons = page.getByRole("button", { name: /start training/i });
    const count = await startButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("clicking Start Training loads trainer", async ({ page }) => {
    await page.goto("/train/endgame");

    // Click first Start Training button
    const firstBtn = page.getByRole("button", { name: /start training/i }).first();
    await firstBtn.click();

    // Back button should appear
    await expect(
      page.getByRole("button", { name: /back to endgames/i })
    ).toBeVisible({ timeout: 10000 });

    // Board should be visible
    const board = page.locator('[role="grid"]');
    await expect(board).toBeVisible();
  });

  test("back button returns to selector", async ({ page }) => {
    await page.goto("/train/endgame");

    // Click first Start Training button
    const firstBtn = page.getByRole("button", { name: /start training/i }).first();
    await firstBtn.click();

    // Wait for trainer
    await expect(
      page.getByRole("button", { name: /back to endgames/i })
    ).toBeVisible({ timeout: 10000 });

    // Click back
    await page.getByRole("button", { name: /back to endgames/i }).click();

    // Should return to selector
    await expect(page.locator("header").getByText("Endgame Trainer")).toBeVisible();
  });
});
