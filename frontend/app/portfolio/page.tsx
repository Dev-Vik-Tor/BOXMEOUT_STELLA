"use client";
import { PortfolioTable } from "@/components/PortfolioTable";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useWallet } from "@/hooks/useWallet";

export default function PortfolioPage(): JSX.Element {
  const { address } = useWallet();
  const { bets, markets, isLoading } = usePortfolio(address);

  if (!address) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-4xl mb-4">👛</p>
        <p>Connect your wallet to view your portfolio.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">My Portfolio</h1>

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-800 rounded" />
          ))}
        </div>
      ) : (
        /* PortfolioTable wraps its own overflow-x-auto — no page-level scroll */
        <PortfolioTable bets={bets} markets={markets} />
      )}
    </div>
  );
}
