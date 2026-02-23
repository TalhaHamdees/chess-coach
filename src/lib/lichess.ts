/** A move from the Lichess Opening Explorer */
export interface LichessMove {
  /** UCI notation, e.g. "e2e4" */
  uci: string;
  /** SAN notation, e.g. "e4" */
  san: string;
  /** Number of white wins */
  white: number;
  /** Number of draws */
  draws: number;
  /** Number of black wins */
  black: number;
  /** Average Elo of players */
  averageRating: number;
}

/** Full Lichess Opening Explorer response */
export interface LichessExplorerResponse {
  white: number;
  draws: number;
  black: number;
  moves: LichessMove[];
  topGames: unknown[];
  opening: { eco: string; name: string } | null;
}

/** Options for the Lichess Explorer query */
export interface LichessExplorerOptions {
  speeds?: string[];
  ratings?: string[];
  topGames?: number;
}

const EXPLORER_BASE_URL = "https://explorer.lichess.ovh/lichess";
const MIN_REQUEST_INTERVAL = 1000; // 1 second rate limit
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

const DEFAULT_SPEEDS = ["rapid", "classical"];
const DEFAULT_RATINGS = ["1600", "1800", "2000", "2200", "2500"];

// Module-level rate limiter state
let lastRequestTime = 0;

// In-memory cache
interface CacheEntry {
  data: LichessExplorerResponse;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function buildCacheKey(fen: string, options: LichessExplorerOptions): string {
  const speeds = (options.speeds ?? DEFAULT_SPEEDS).join(",");
  const ratings = (options.ratings ?? DEFAULT_RATINGS).join(",");
  return `${fen}|${speeds}|${ratings}`;
}

function evictStaleEntries(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

/**
 * Fetches opening statistics from the Lichess Opening Explorer.
 *
 * Rate-limited to 1 request/sec. Responses cached for 5 minutes.
 */
export async function fetchLichessExplorer(
  fen: string,
  options: LichessExplorerOptions = {}
): Promise<LichessExplorerResponse> {
  const cacheKey = buildCacheKey(fen, options);

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Enforce rate limit
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - elapsed)
    );
  }

  const speeds = (options.speeds ?? DEFAULT_SPEEDS).join(",");
  const ratings = (options.ratings ?? DEFAULT_RATINGS).join(",");
  const topGames = options.topGames ?? 0;

  const params = new URLSearchParams({
    fen,
    speeds,
    ratings,
    topGames: String(topGames),
  });

  lastRequestTime = Date.now();
  const response = await fetch(`${EXPLORER_BASE_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Lichess Explorer error: ${response.status}`);
  }

  const data = (await response.json()) as LichessExplorerResponse;

  // Store in cache, evicting old entries if needed
  evictStaleEntries();
  if (cache.size >= MAX_CACHE_SIZE) {
    // Remove the oldest entry
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) {
      cache.delete(firstKey);
    }
  }
  cache.set(cacheKey, { data, timestamp: Date.now() });

  return data;
}

/**
 * Total games for an explorer response.
 */
export function getTotalGames(response: LichessExplorerResponse): number {
  return response.white + response.draws + response.black;
}

/**
 * Win rate for a specific move from the perspective of a given color.
 * Returns a value between 0 and 1, or 0 if no games.
 */
export function getMoveWinRate(
  move: LichessMove,
  color: "w" | "b"
): number {
  const total = move.white + move.draws + move.black;
  if (total === 0) return 0;
  const wins = color === "w" ? move.white : move.black;
  return wins / total;
}

/**
 * Clears the in-memory Lichess Explorer cache.
 */
export function clearLichessCache(): void {
  cache.clear();
}

/**
 * Resets all module-level state (cache + rate limiter). For testing only.
 */
export function _resetForTesting(): void {
  cache.clear();
  lastRequestTime = 0;
}
