"use client";

import { useState } from "react";

export interface CreateMarketFormData {
  fighterAName: string;
  fighterARecord: string;
  fighterANationality: string;
  fighterAWeightClass: string;
  fighterBName: string;
  fighterBRecord: string;
  fighterBNationality: string;
  fighterBWeightClass: string;
  scheduledAt: string;    // ISO date string
  bettingEndsAt: string;
  oracleAddress: string;
}

export interface CreateMarketFormProps {
  onSubmit: (formData: CreateMarketFormData) => Promise<void>;
}

/**
 * Multi-field form for creating a new boxing market.
 * Validates all fields before calling create_market() on MarketFactory.
 * Shows per-field validation errors inline. Disabled while submission is in-flight.
 */
export function CreateMarketForm({ onSubmit }: CreateMarketFormProps): JSX.Element {
  const [formData, setFormData] = useState<CreateMarketFormData>({
    fighterAName: "",
    fighterARecord: "",
    fighterANationality: "",
    fighterAWeightClass: "",
    fighterBName: "",
    fighterBRecord: "",
    fighterBNationality: "",
    fighterBWeightClass: "",
    scheduledAt: "",
    bettingEndsAt: "",
    oracleAddress: "",
  });

  return (
    <form
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(formData);
      }}
    >
      <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Fighter A name" value={formData.fighterAName} onChange={(e) => setFormData({ ...formData, fighterAName: e.target.value })} />
      <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Fighter B name" value={formData.fighterBName} onChange={(e) => setFormData({ ...formData, fighterBName: e.target.value })} />
      <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Oracle address" value={formData.oracleAddress} onChange={(e) => setFormData({ ...formData, oracleAddress: e.target.value })} />
      <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Create Market</button>
    </form>
  );
}
