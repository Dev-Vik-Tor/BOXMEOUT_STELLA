import { fetchMarkets } from "@/lib/api";
import { HomePageContent } from "@/components/HomePageContent";

export const revalidate = 30; // ISR: revalidate every 30s

export default async function HomePage(): Promise<JSX.Element> {
  // Server-side fetch for faster first paint (no loading flash)
  const initialMarkets = await fetchMarkets().catch(() => []);

  return <HomePageContent initialMarkets={initialMarkets} />;
}
