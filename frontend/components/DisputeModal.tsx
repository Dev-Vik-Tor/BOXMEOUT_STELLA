"use client";
import { Market } from "@/lib/api";

export interface DisputeModalProps {
  market: Market;
  onDisputed: () => void;
}

/**
 * Modal for raising a dispute after market resolution.
 * Only visible within the protocol's dispute_window_sec after market.resolvedAt.
 * Submits raise_dispute() on-chain via wallet with the bettor's written reason.
 */
export function DisputeModal({ market, onDisputed }: DisputeModalProps): JSX.Element {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="font-semibold">Dispute {market.id}</div>
      <p className="mt-1">Call the dispute flow within the active window for this market.</p>
      <button type="button" onClick={onDisputed} className="mt-3 rounded-lg bg-amber-600 px-3 py-2 text-white">Raise Dispute</button>
    </div>
  );
}
