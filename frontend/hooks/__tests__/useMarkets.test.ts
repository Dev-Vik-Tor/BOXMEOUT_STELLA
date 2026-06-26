import { renderHook, waitFor, act } from '@testing-library/react';
import { useMarkets } from '@/hooks/useMarkets';
import { fetchMarkets } from '@/lib/api';
import { Market } from '@/lib/api';

jest.mock('@/lib/api');

const mockFetchMarkets = fetchMarkets as jest.MockedFunction<typeof fetchMarkets>;

const mockMarket: Market = {
  id: '1',
  contractAddress: 'CA123',
  fighterA: {
    name: 'Fighter A',
    record: '10-0',
    nationality: 'USA',
    weightClass: 'Heavyweight',
  },
  fighterB: {
    name: 'Fighter B',
    record: '8-2',
    nationality: 'UK',
    weightClass: 'Heavyweight',
  },
  scheduledAt: '2026-07-01T00:00:00Z',
  bettingEndsAt: '2026-06-30T00:00:00Z',
  status: 'Open',
  outcome: null,
  poolA: '1000',
  poolB: '1500',
  totalPool: '2500',
  oracleAddress: 'OA123',
  createdBy: 'CA123',
};

describe('useMarkets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('populates markets after successful fetch', async () => {
    mockFetchMarkets.mockResolvedValue([mockMarket]);

    const { result } = renderHook(() => useMarkets());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.markets).toEqual([mockMarket]);
    expect(result.current.error).toBe(null);
  });

  it('sets isLoading true during fetch, false after', async () => {
    mockFetchMarkets.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([mockMarket]), 100))
    );

    const { result } = renderHook(() => useMarkets());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('sets error on fetch failure', async () => {
    const error = new Error('Fetch failed');
    mockFetchMarkets.mockRejectedValue(error);

    const { result } = renderHook(() => useMarkets());

    await waitFor(() => {
      expect(result.current.error?.message).toBe('Fetch failed');
    });

    expect(result.current.markets).toEqual([]);
  });

  it('refetch() triggers fetch immediately', async () => {
    mockFetchMarkets.mockResolvedValue([mockMarket]);

    const { result } = renderHook(() => useMarkets());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetchMarkets).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });

    expect(mockFetchMarkets).toHaveBeenCalledTimes(2);
  });

  it('polls every 30 seconds', async () => {
    mockFetchMarkets.mockResolvedValue([mockMarket]);

    renderHook(() => useMarkets());

    await waitFor(() => {
      expect(mockFetchMarkets).toHaveBeenCalledTimes(1);
    });

    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(mockFetchMarkets).toHaveBeenCalledTimes(2);
  });

  it('clears interval on unmount', async () => {
    mockFetchMarkets.mockResolvedValue([mockMarket]);
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = renderHook(() => useMarkets());

    await waitFor(() => {
      expect(mockFetchMarkets).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
