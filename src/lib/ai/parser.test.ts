import { describe, it, expect } from "vitest";
import { parseCoachResponse } from "./parser";

describe("parseCoachResponse", () => {
  const validJSON = JSON.stringify({
    message: "Great move! You're controlling the center.",
    fen: null,
    arrows: [{ from: "e2", to: "e4", color: "green" }],
    highlights: ["e4", "d5"],
    engineMove: "d2-d4",
    suggestedMove: "g1-f3",
    moveQuality: "good",
  });

  describe("valid JSON parsing", () => {
    it("parses a complete valid response", () => {
      const result = parseCoachResponse(validJSON);
      expect(result.message).toBe(
        "Great move! You're controlling the center."
      );
      expect(result.fen).toBeNull();
      expect(result.arrows).toEqual([
        { from: "e2", to: "e4", color: "green" },
      ]);
      expect(result.highlights).toEqual(["e4", "d5"]);
      expect(result.engineMove).toBe("d2-d4");
      expect(result.suggestedMove).toBe("g1-f3");
      expect(result.moveQuality).toBe("good");
    });

    it("parses response with valid FEN", () => {
      const json = JSON.stringify({
        message: "Here's the position after Nf3.",
        fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
        arrows: [],
        highlights: [],
        engineMove: null,
        suggestedMove: null,
        moveQuality: null,
      });
      const result = parseCoachResponse(json);
      expect(result.fen).toBe(
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
      );
    });

    it("parses all move quality values", () => {
      const qualities = [
        "brilliant",
        "good",
        "inaccuracy",
        "mistake",
        "blunder",
      ];
      for (const quality of qualities) {
        const json = JSON.stringify({
          message: "test",
          moveQuality: quality,
        });
        const result = parseCoachResponse(json);
        expect(result.moveQuality).toBe(quality);
      }
    });

    it("parses response with all null optional fields", () => {
      const json = JSON.stringify({
        message: "Hello!",
        fen: null,
        arrows: [],
        highlights: [],
        engineMove: null,
        suggestedMove: null,
        moveQuality: null,
      });
      const result = parseCoachResponse(json);
      expect(result.message).toBe("Hello!");
      expect(result.fen).toBeNull();
      expect(result.arrows).toEqual([]);
      expect(result.highlights).toEqual([]);
      expect(result.engineMove).toBeNull();
      expect(result.suggestedMove).toBeNull();
      expect(result.moveQuality).toBeNull();
    });
  });

  describe("markdown code fence stripping", () => {
    it("strips ```json fences", () => {
      const raw = '```json\n' + validJSON + '\n```';
      const result = parseCoachResponse(raw);
      expect(result.message).toBe(
        "Great move! You're controlling the center."
      );
      expect(result.arrows).toHaveLength(1);
    });

    it("strips plain ``` fences", () => {
      const raw = '```\n' + validJSON + '\n```';
      const result = parseCoachResponse(raw);
      expect(result.message).toBe(
        "Great move! You're controlling the center."
      );
    });
  });

  describe("invalid JSON fallback", () => {
    it("returns raw text as message on invalid JSON", () => {
      const raw = "I think you should play e4. It controls the center.";
      const result = parseCoachResponse(raw);
      expect(result.message).toBe(raw);
      expect(result.fen).toBeNull();
      expect(result.arrows).toEqual([]);
      expect(result.highlights).toEqual([]);
      expect(result.engineMove).toBeNull();
      expect(result.suggestedMove).toBeNull();
      expect(result.moveQuality).toBeNull();
    });

    it("returns empty message on empty input", () => {
      const result = parseCoachResponse("");
      expect(result.message).toBe("");
    });

    it("returns empty message on whitespace-only input", () => {
      const result = parseCoachResponse("   ");
      expect(result.message).toBe("");
    });

    it("falls back when JSON is an array", () => {
      const raw = '[{"message": "test"}]';
      const result = parseCoachResponse(raw);
      expect(result.message).toBe(raw);
    });
  });

  describe("field validation", () => {
    it("rejects invalid FEN", () => {
      const json = JSON.stringify({
        message: "test",
        fen: "not-a-valid-fen",
      });
      const result = parseCoachResponse(json);
      expect(result.fen).toBeNull();
    });

    it("rejects empty FEN string", () => {
      const json = JSON.stringify({
        message: "test",
        fen: "",
      });
      const result = parseCoachResponse(json);
      expect(result.fen).toBeNull();
    });

    it("filters out arrows with invalid colors", () => {
      const json = JSON.stringify({
        message: "test",
        arrows: [
          { from: "e2", to: "e4", color: "green" },
          { from: "d2", to: "d4", color: "purple" },
        ],
      });
      const result = parseCoachResponse(json);
      expect(result.arrows).toHaveLength(1);
      expect(result.arrows[0].color).toBe("green");
    });

    it("filters out arrows with invalid squares", () => {
      const json = JSON.stringify({
        message: "test",
        arrows: [
          { from: "e2", to: "e4", color: "green" },
          { from: "e9", to: "e4", color: "red" },
          { from: "e2", to: "z4", color: "blue" },
        ],
      });
      const result = parseCoachResponse(json);
      expect(result.arrows).toHaveLength(1);
    });

    it("filters out invalid highlight squares", () => {
      const json = JSON.stringify({
        message: "test",
        highlights: ["e4", "z9", "d5", "invalid", "a1"],
      });
      const result = parseCoachResponse(json);
      expect(result.highlights).toEqual(["e4", "d5", "a1"]);
    });

    it("rejects invalid move quality", () => {
      const json = JSON.stringify({
        message: "test",
        moveQuality: "excellent",
      });
      const result = parseCoachResponse(json);
      expect(result.moveQuality).toBeNull();
    });

    it("rejects invalid engineMove format", () => {
      const json = JSON.stringify({
        message: "test",
        engineMove: "e4",
      });
      const result = parseCoachResponse(json);
      expect(result.engineMove).toBeNull();
    });

    it("rejects invalid suggestedMove format", () => {
      const json = JSON.stringify({
        message: "test",
        suggestedMove: "Nf3",
      });
      const result = parseCoachResponse(json);
      expect(result.suggestedMove).toBeNull();
    });

    it("uses raw text as message when message field is not a string", () => {
      const json = JSON.stringify({
        message: 42,
        arrows: [],
      });
      const result = parseCoachResponse(json);
      expect(result.message).toBe(json);
    });

    it("handles missing optional fields with defaults", () => {
      const json = JSON.stringify({
        message: "Just a message",
      });
      const result = parseCoachResponse(json);
      expect(result.message).toBe("Just a message");
      expect(result.fen).toBeNull();
      expect(result.arrows).toEqual([]);
      expect(result.highlights).toEqual([]);
      expect(result.engineMove).toBeNull();
      expect(result.suggestedMove).toBeNull();
      expect(result.moveQuality).toBeNull();
    });
  });
});
