import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock next-themes
const mockSetTheme = vi.fn();
let mockTheme = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
  }),
}));

import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    mockTheme = "light";
    mockSetTheme.mockClear();
  });

  it("renders toggle button", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button", { name: /toggle theme/i });
    expect(btn).toBeInTheDocument();
  });

  it("calls setTheme to dark when in light mode", () => {
    mockTheme = "light";
    render(<ThemeToggle />);
    const btn = screen.getByRole("button", { name: /toggle theme/i });
    fireEvent.click(btn);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme to light when in dark mode", () => {
    mockTheme = "dark";
    render(<ThemeToggle />);
    const btn = screen.getByRole("button", { name: /toggle theme/i });
    fireEvent.click(btn);
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("has accessible label", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button", { name: /toggle theme/i });
    expect(btn).toHaveAttribute("aria-label", "Toggle theme");
  });
});
