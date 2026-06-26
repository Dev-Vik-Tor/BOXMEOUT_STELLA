'use client';

import { useEffect, useState } from 'react';
import { fetchMarkets } from '@/lib/api';
import { Market, MarketFilters } from '@/lib/api';

export type { MarketFilters };

export interface UseMarketsResult {
  markets: Market[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetches and manages the list of boxing markets from the backend API.
 * Polls automatically every 30 seconds for live updates.
 * Returns loading and error states for the caller to handle.
 */
export function useMarkets(filters?: MarketFilters): UseMarketsResult {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMarkets(filters);
      setMarkets(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  return { markets, isLoading, error, refetch: fetch };
}
