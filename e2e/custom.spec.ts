import { test, expect } from "@playwright/test";

test.describe("Custom Position Trainer", () => {
  test("loads with setup board and piece palette", async ({ page }) => {
    await page.goto("/train/custom");

    // Header should show
    await expect(page.getByText("Custom Position")).toBeVisible();

    // Setup board should be visible (it's a grid of squares)
    const board = page.locator('[role="grid"]');
    await expect(board).toBeVisible();

    // Piece palette section should be visible
    await expect(page.getByText("Select a piece")).toBeVisible();
  });

  test("has board control buttons", async ({ page }) => {
    await page.goto("/train/custom");

    await expect(page.getByRole("button", { name: /clear/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /start position/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /to move/i })).toBeVisible();
  });

  test("FEN input loads position", async ({ page }) => {
    await page.goto("/train/custom");

    // FEN input should be present
    const fenInput = page.getByLabel("FEN input");
    await expect(fenInput).toBeVisible();

    // Type a FEN
    await fenInput.fill("8/8/4k3/8/8/8/8/R3K3 w - - 0 1");

    // Click Load
    await page.getByRole("button", { name: "Load" }).click();

    // Board should still be visible (position loaded)
    const board = page.locator('[role="grid"]');
    await expect(board).toBeVisible();
  });

  test("Start Training switches to play mode", async ({ page }) => {
    await page.goto("/train/custom");

    // Click Start Position first to ensure valid setup
    await page.getByRole("button", { name: /start position/i }).click();

    // Click Start Training
    await page.getByRole("button", { name: /start training/i }).click();

    // Should switch to play mode — Flip button and "Back to setup" should appear
    await expect(page.getByRole("button", { name: /back to setup/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /flip/i })).toBeVisible();
  });

  test("back to setup returns from play mode", async ({ page }) => {
    await page.goto("/train/custom");

    // Set up and start
    await page.getByRole("button", { name: /start position/i }).click();
    await page.getByRole("button", { name: /start training/i }).click();

    // Go back
    await page.getByRole("button", { name: /back to setup/i }).click();

    // Should be back in setup mode
    await expect(page.getByText("Select a piece")).toBeVisible();
  });
});
