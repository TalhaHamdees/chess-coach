"use client";

import { useEffect, useState } from "react";
import { fetchLichessExplorer, getMoveWinRate } from "@/lib/lichess";
import type { LichessExplorerResponse, LichessMove } from "@/lib/lichess";
import type { PieceColor } from "@/types/chess";

interface LichessExplorerProps {
  fen: string;
  playerColor: PieceColor;
}

type LoadingState = "idle" | "loading" | "loaded" | "error";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function WinBar({ move, color }: { move: LichessMove; color: PieceColor }) {
  const total = move.white + move.draws + move.black;
  if (total === 0) return null;

  const whitePct = (move.white / total) * 100;
  const drawPct = (move.draws / total) * 100;
  const blackPct = (move.black / total) * 100;

  return (
    <div
      className="flex h-3 w-full overflow-hidden rounded-sm"
      role="img"
      aria-label={`White ${whitePct.toFixed(0)}%, Draw ${drawPct.toFixed(0)}%, Black ${blackPct.toFixed(0)}%`}
    >
      <div
        className="bg-white border border-gray-300"
        style={{ width: `${whitePct}%` }}
      />
      <div className="bg-gray-400" style={{ width: `${drawPct}%` }} />
      <div className="bg-gray-800" style={{ width: `${blackPct}%` }} />
    </div>
  );
}

export function LichessExplorer({ fen, playerColor }: LichessExplorerProps) {
  const [data, setData] = useState<LichessExplorerResponse | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingState("loading");
      try {
        const response = await fetchLichessExplorer(fen);
        if (!cancelled) {
          setData(response);
          setLoadingState("loaded");
        }
      } catch {
        if (!cancelled) {
          setLoadingState("error");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [fen]);

  const totalGames = data ? data.white + data.draws + data.black : 0;
  const topMoves = data?.moves.slice(0, 5) ?? [];

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold text-foreground">
        Lichess Explorer
      </h3>

      {loadingState === "loading" && (
        <p className="text-xs text-muted-foreground">Loading statistics...</p>
      )}

      {loadingState === "error" && (
        <p className="text-xs text-red-400">
          Failed to load explorer data.
        </p>
      )}

      {loadingState === "loaded" && topMoves.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No games found for this position.
        </p>
      )}

      {loadingState === "loaded" && topMoves.length > 0 && (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            {formatNumber(totalGames)} games
          </p>
          <div className="space-y-2">
            {topMoves.map((move) => {
              const winRate = getMoveWinRate(move, playerColor);
              const moveTotal = move.white + move.draws + move.black;

              return (
                <div key={move.uci} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-medium">{move.san}</span>
                    <span className="text-muted-foreground">
                      {formatNumber(moveTotal)} &middot;{" "}
                      {(winRate * 100).toFixed(0)}% win
                    </span>
                  </div>
                  <WinBar move={move} color={playerColor} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
