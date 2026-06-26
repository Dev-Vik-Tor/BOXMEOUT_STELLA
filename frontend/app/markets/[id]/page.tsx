import { fetchMarketById, fetchMarketBets, fetchOddsHistory } from "@/lib/api";
import { MarketDetailClient } from "@/components/MarketDetailClient";
import { notFound } from "next/navigation";

interface Props {
  params: { id: string };
}

export default async function MarketDetailPage({ params }: Props): Promise<JSX.Element> {
  const [market, bets, oddsHistory] = await Promise.all([
    fetchMarketById(params.id).catch(() => null),
    fetchMarketBets(params.id).catch(() => []),
    fetchOddsHistory(params.id).catch(() => []),
  ]);

  if (!market) notFound();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <MarketDetailClient
        marketId={params.id}
        initialMarket={market}
        initialBets={bets}
        initialOddsHistory={oddsHistory}
      />
    </div>
  );
}
