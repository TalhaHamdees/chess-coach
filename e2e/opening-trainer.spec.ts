import { test, expect } from "@playwright/test";

test.describe("Opening Trainer", () => {
  test("selector loads with openings", async ({ page }) => {
    await page.goto("/train/opening");

    // Header should show
    await expect(page.locator("header").getByText("Opening Trainer")).toBeVisible();

    // Should have Start Training buttons (one per opening card)
    const startButtons = page.getByRole("button", { name: /start training/i });
    const count = await startButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("filter buttons work", async ({ page }) => {
    await page.goto("/train/opening");

    // All filter buttons should be visible
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();

    // Click 1.e4 filter
    await page.getByRole("button", { name: "1.e4" }).click();

    // Should still have some opening cards with Start Training buttons
    const startButtons = page.getByRole("button", { name: /start training/i });
    const count = await startButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("clicking opening navigates to trainer", async ({ page }) => {
    await page.goto("/train/opening");

    // Click the first Start Training button
    const firstBtn = page.getByRole("button", { name: /start training/i }).first();
    await firstBtn.click();

    // Should navigate to trainer page
    await page.waitForURL(/\/train\/opening\/.+/, { timeout: 10000 });

    // Board should be visible
    const board = page.locator('[role="grid"]');
    await expect(board).toBeVisible();
  });

  test("trainer page shows variation tree", async ({ page }) => {
    await page.goto("/train/opening/italian-game");

    // Should show opening name
    await expect(page.locator("header").getByText("Italian Game")).toBeVisible();

    // Should show ECO code
    await expect(page.getByText("C50")).toBeVisible();

    // Should show Variations section
    await expect(page.getByText("Variations")).toBeVisible();

    // Board should be present
    const board = page.locator('[role="grid"]');
    await expect(board).toBeVisible();
  });
});
