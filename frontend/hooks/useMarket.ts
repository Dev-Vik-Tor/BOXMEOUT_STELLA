'use client';

import { useEffect, useState } from 'react';
import { fetchMarketById } from '@/lib/api';
import { Market } from '@/lib/api';

export interface UseMarketResult {
  market: Market | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetches a single market by ID and polls every 10 seconds for live odds updates.
 * Returns null in market field while loading or if the market does not exist.
 */
export function useMarket(market_id: string): UseMarketResult {
  const [market, setMarket] = useState<Market | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMarketById(market_id);
      setMarket(data);
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) {
        setMarket(null);
      }
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, [market_id]);

  return { market, isLoading, error, refetch: fetch };
}
