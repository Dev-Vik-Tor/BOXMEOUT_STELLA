import { Market, MarketStatus } from "@/lib/api";
import MarketCard from "./MarketCard";
import { LoadingSkeleton } from "./LoadingSkeleton";

export interface MarketListProps {
  markets: Market[];
  isLoading: boolean;
  filter?: MarketStatus;
}

export function MarketList({ markets, isLoading, filter }: MarketListProps): JSX.Element {
  if (isLoading) return <LoadingSkeleton variant="card" count={6} />;

  const filtered = filter ? markets.filter((m) => m.status === filter) : markets;

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-4xl mb-3">🥊</p>
        <p>No {filter?.toLowerCase() ?? ""} markets yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map((m) => (
        <MarketCard key={m.id} market={m} showOdds={m.status === "Open"} />
      ))}
    </div>
  );
}
