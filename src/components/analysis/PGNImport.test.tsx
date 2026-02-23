import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PGNImport } from "./PGNImport";
import { useAnalysisStore } from "@/stores/analysisStore";
import { useGameStore } from "@/stores/gameStore";

describe("PGNImport", () => {
  beforeEach(() => {
    useAnalysisStore.getState().reset();
    useGameStore.getState().reset();
  });

  it("renders all three import inputs", () => {
    render(<PGNImport />);
    expect(screen.getByLabelText("Paste PGN")).toBeInTheDocument();
    expect(screen.getByLabelText("Upload PGN file")).toBeInTheDocument();
    expect(screen.getByLabelText("Lichess Game URL")).toBeInTheDocument();
  });

  it("renders import and fetch buttons", () => {
    render(<PGNImport />);
    expect(screen.getByRole("button", { name: "Import PGN" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fetch" })).toBeInTheDocument();
  });

  it("calls importPGN when Import PGN button is clicked", () => {
    const importSpy = vi.spyOn(useAnalysisStore.getState(), "importPGN");
    render(<PGNImport />);

    const textarea = screen.getByLabelText("Paste PGN");
    fireEvent.change(textarea, { target: { value: "1. e4 e5" } });
    fireEvent.click(screen.getByRole("button", { name: "Import PGN" }));

    expect(importSpy).toHaveBeenCalledWith("1. e4 e5");
  });

  it("calls importFromUrl for Lichess URL", async () => {
    const importUrlSpy = vi.spyOn(useAnalysisStore.getState(), "importFromUrl");
    render(<PGNImport />);

    const urlInput = screen.getByLabelText("Lichess Game URL");
    fireEvent.change(urlInput, { target: { value: "https://lichess.org/abcdefgh" } });
    fireEvent.click(screen.getByRole("button", { name: "Fetch" }));

    await waitFor(() => {
      expect(importUrlSpy).toHaveBeenCalledWith("https://lichess.org/abcdefgh");
    });
  });

  it("disables import button when textarea is empty", () => {
    render(<PGNImport />);
    expect(screen.getByRole("button", { name: "Import PGN" })).toBeDisabled();
  });

  it("disables fetch button for invalid URLs", () => {
    render(<PGNImport />);
    const urlInput = screen.getByLabelText("Lichess Game URL");
    fireEvent.change(urlInput, { target: { value: "not-a-url" } });
    expect(screen.getByRole("button", { name: "Fetch" })).toBeDisabled();
  });

  it("shows error message when importError is set", () => {
    useAnalysisStore.setState({ importError: "Test error message" });
    render(<PGNImport />);
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("reads PGN from file upload", async () => {
    // Replace FileReader with a mock class before rendering
    const originalFileReader = globalThis.FileReader;
    let capturedOnload: ((event: { target: { result: string } }) => void) | null = null;

    class MockFileReader {
      onload: ((event: { target: { result: string } }) => void) | null = null;
      readAsText() {
        capturedOnload = this.onload;
      }
    }
    globalThis.FileReader = MockFileReader as unknown as typeof FileReader;

    const importSpy = vi.spyOn(useAnalysisStore.getState(), "importPGN");
    render(<PGNImport />);

    const fileInput = screen.getByLabelText("Upload PGN file");
    const file = new File(["1. d4 d5 2. c4"], "game.pgn", { type: "text/plain" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Trigger the onload callback
    if (capturedOnload) {
      capturedOnload({ target: { result: "1. d4 d5 2. c4" } });
    }

    expect(importSpy).toHaveBeenCalledWith("1. d4 d5 2. c4");

    // Restore
    globalThis.FileReader = originalFileReader;
  });
});
