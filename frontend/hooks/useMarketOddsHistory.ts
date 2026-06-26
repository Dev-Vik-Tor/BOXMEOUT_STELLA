import { OddsSnapshot } from "@/lib/api";

export interface UseMarketOddsHistoryResult {
  snapshots: OddsSnapshot[];
  isLoading: boolean;
}

/**
 * Fetches historical odds snapshots for the market odds chart.
 * Each snapshot contains { timestamp, poolA, poolB, oddsA, oddsB }.
 * Fetched once on mount; does not poll (history is append-only).
 */
export function useMarketOddsHistory(market_id: string): UseMarketOddsHistoryResult {
  throw new Error("Not implemented");
}
