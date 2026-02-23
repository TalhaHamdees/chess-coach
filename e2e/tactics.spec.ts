import { test, expect } from "@playwright/test";

test.describe("Tactics Trainer", () => {
  test("loads with header and puzzle cards", async ({ page }) => {
    await page.goto("/train/tactics");

    // Header should show
    await expect(page.locator("header").getByText("Tactics Trainer")).toBeVisible();

    // Should have Solve Puzzle buttons (one per card)
    const solveButtons = page.getByRole("button", { name: /solve puzzle/i });
    const count = await solveButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("filter by difficulty works", async ({ page }) => {
    await page.goto("/train/tactics");

    // Filter buttons should be present
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Beginner" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Intermediate" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Advanced" })).toBeVisible();

    // Click Beginner filter
    await page.getByRole("button", { name: "Beginner" }).click();

    // Should still have solve buttons
    const solveButtons = page.getByRole("button", { name: /solve puzzle/i });
    const count = await solveButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("clicking Solve Puzzle loads trainer", async ({ page }) => {
    await page.goto("/train/tactics");

    // Click first Solve Puzzle button
    const firstSolveBtn = page.getByRole("button", { name: /solve puzzle/i }).first();
    await firstSolveBtn.click();

    // Back button should appear (trainer view)
    await expect(
      page.getByRole("button", { name: /back to puzzles/i })
    ).toBeVisible({ timeout: 10000 });

    // Board should be visible
    const board = page.locator('[role="grid"]');
    await expect(board).toBeVisible();
  });

  test("back button returns to selector", async ({ page }) => {
    await page.goto("/train/tactics");

    // Click first Solve Puzzle button
    const firstSolveBtn = page.getByRole("button", { name: /solve puzzle/i }).first();
    await firstSolveBtn.click();

    // Wait for trainer to load
    await expect(
      page.getByRole("button", { name: /back to puzzles/i })
    ).toBeVisible({ timeout: 10000 });

    // Click back
    await page.getByRole("button", { name: /back to puzzles/i }).click();

    // Should return to selector
    await expect(page.locator("header").getByText("Tactics Trainer")).toBeVisible();
  });
});
