import { NextResponse } from "next/server";

// Cache the price for 1 hour (3600 seconds)
let cachedPrice: number | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in ms

async function fetchEthPrice(): Promise<number> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      { next: { revalidate: 3600 } } // Next.js cache for 1 hour
    );

    if (!response.ok) {
      throw new Error("Failed to fetch ETH price");
    }

    const data = await response.json();
    return data.ethereum.usd;
  } catch (error) {
    console.error("Error fetching ETH price:", error);
    // Fallback to approximate price if API fails
    return 3000;
  }
}

export async function GET() {
  const now = Date.now();

  // Return cached price if still valid
  if (cachedPrice && (now - cacheTimestamp) < CACHE_DURATION) {
    return NextResponse.json({
      price: cachedPrice,
      cached: true,
      cachedAt: new Date(cacheTimestamp).toISOString(),
    });
  }

  // Fetch fresh price
  const price = await fetchEthPrice();
  cachedPrice = price;
  cacheTimestamp = now;

  return NextResponse.json({
    price,
    cached: false,
    fetchedAt: new Date(now).toISOString(),
  });
}
