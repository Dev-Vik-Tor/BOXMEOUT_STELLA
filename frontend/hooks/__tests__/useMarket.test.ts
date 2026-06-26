import { renderHook, waitFor, act } from '@testing-library/react';
import { useMarket } from '@/hooks/useMarket';
import { fetchMarketById } from '@/lib/api';
import { Market } from '@/lib/api';

jest.mock('@/lib/api');

const mockFetchMarketById = fetchMarketById as jest.MockedFunction<typeof fetchMarketById>;

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

describe('useMarket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('returns market after successful fetch', async () => {
    mockFetchMarketById.mockResolvedValue(mockMarket);

    const { result } = renderHook(() => useMarket('1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.market).toEqual(mockMarket);
    expect(result.current.error).toBe(null);
  });

  it('polls every 10 seconds', async () => {
    mockFetchMarketById.mockResolvedValue(mockMarket);

    renderHook(() => useMarket('1'));

    await waitFor(() => {
      expect(mockFetchMarketById).toHaveBeenCalledTimes(1);
    });

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockFetchMarketById).toHaveBeenCalledTimes(2);
  });

  it('sets market=null and error on 404', async () => {
    const notFoundError = new Error('404 Not Found');
    mockFetchMarketById.mockRejectedValue(notFoundError);

    const { result } = renderHook(() => useMarket('nonexistent'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.market).toBe(null);
    expect(result.current.error).not.toBe(null);
  });

  it('clears interval on unmount', async () => {
    mockFetchMarketById.mockResolvedValue(mockMarket);
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = renderHook(() => useMarket('1'));

    await waitFor(() => {
      expect(mockFetchMarketById).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('calls refetch immediately', async () => {
    mockFetchMarketById.mockResolvedValue(mockMarket);

    const { result } = renderHook(() => useMarket('1'));

    await waitFor(() => {
      expect(mockFetchMarketById).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.refetch();
    });

    expect(mockFetchMarketById).toHaveBeenCalledTimes(2);
  });
});
