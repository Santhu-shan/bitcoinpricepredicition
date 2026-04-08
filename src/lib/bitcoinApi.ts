// Fetch real Bitcoin historical data from CoinGecko (free, no API key needed)

export interface HistoricalPrice {
  date: string;
  timestamp: number;
  price: number;
  volume: number;
  marketCap: number;
}

export async function fetchBitcoinHistory(days: number = 365): Promise<HistoricalPrice[]> {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=daily`
  );

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();

  const prices: [number, number][] = data.prices;
  const volumes: [number, number][] = data.total_volumes;
  const marketCaps: [number, number][] = data.market_caps;

  return prices.map((p, i) => ({
    timestamp: p[0],
    date: new Date(p[0]).toISOString().split("T")[0],
    price: Math.round(p[1] * 100) / 100,
    volume: volumes[i] ? Math.round(volumes[i][1]) : 0,
    marketCap: marketCaps[i] ? Math.round(marketCaps[i][1]) : 0,
  }));
}

export async function fetchCurrentPrice(): Promise<{
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  marketCap: number;
  volume24h: number;
}> {
  const response = await fetch(
    "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false"
  );

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();
  const md = data.market_data;

  return {
    price: md.current_price.usd,
    change24h: md.price_change_24h,
    changePercent24h: md.price_change_percentage_24h,
    high24h: md.high_24h.usd,
    low24h: md.low_24h.usd,
    marketCap: md.market_cap.usd,
    volume24h: md.total_volume.usd,
  };
}

export interface GlobalMarketData {
  updatedAt: string;
  btcDominancePct: number;
  totalMarketCapUsd: number;
  totalVolumeUsd: number;
  marketCapChangePct24hUsd: number;
  activeCryptocurrencies: number;
  markets: number;
}

/** High-level global crypto market snapshot (CoinGecko). */
export async function fetchGlobalMarketData(): Promise<GlobalMarketData> {
  const response = await fetch("https://api.coingecko.com/api/v3/global");
  if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
  const json = await response.json();
  const d = json.data;
  const updatedAt = new Date(d.updated_at * 1000).toISOString();
  return {
    updatedAt,
    btcDominancePct: d.market_cap_percentage?.btc ?? 0,
    totalMarketCapUsd: d.total_market_cap?.usd ?? 0,
    totalVolumeUsd: d.total_volume?.usd ?? 0,
    marketCapChangePct24hUsd: d.market_cap_change_percentage_24h_usd ?? 0,
    activeCryptocurrencies: d.active_cryptocurrencies ?? 0,
    markets: d.markets ?? 0,
  };
}
