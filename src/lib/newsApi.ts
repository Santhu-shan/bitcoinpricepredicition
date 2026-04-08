export interface NewsItem {
  source: string;
  title: string;
  url: string;
  publishedAt: string; // ISO
  body?: string;
}

/**
 * Fetch crypto/bitcoin-related news.
 * Uses the local Node proxy (`/api/news`) to avoid browser CORS issues.
 */
export async function fetchBitcoinNews(limit: number = 25): Promise<NewsItem[]> {
  const res = await fetch(`/api/news?limit=${encodeURIComponent(String(limit))}`);
  if (!res.ok) throw new Error(`News proxy error: ${res.status}`);
  const json = await res.json();
  const items: any[] = json?.items ?? [];
  return items.map((n) => ({
    source: n.source ?? "News",
    title: n.title ?? "",
    url: n.url ?? "",
    publishedAt: n.publishedAt ?? new Date().toISOString(),
    body: n.body ?? "",
  }));
}

export type ImpactLabel = "positive" | "negative" | "neutral";

export interface ImpactScore {
  label: ImpactLabel;
  /** Range roughly -5..+5 (heuristic). */
  score: number;
  reasons: string[];
}

const POSITIVE_KEYWORDS: Array<[RegExp, number, string]> = [
  [/etf|spot etf|approval|inflows?/i, 2.0, "ETF / institutional inflows"],
  [/adoption|accepts bitcoin|integration|partnership/i, 1.2, "Adoption/integration"],
  [/rate cut|cuts rates|easing|liquidity|stimulus/i, 1.2, "Risk-on macro (easing/liquidity)"],
  [/halving|post-halving|supply shock/i, 0.8, "Supply narrative"],
  [/bull|breakout|all-time high|ath/i, 0.6, "Bullish market tone"],
];

const NEGATIVE_KEYWORDS: Array<[RegExp, number, string]> = [
  [/hack|exploit|breach|stolen/i, -2.0, "Security incident"],
  [/ban|crackdown|lawsuit|sec|regulat/i, -1.8, "Regulatory pressure"],
  [/rate hike|tightening|inflation spike|hawkish/i, -1.2, "Risk-off macro (tightening/inflation)"],
  [/liquidat|sell-off|plunge|crash|dump/i, -1.0, "Risk-off / sell-off tone"],
  [/exchange.*(insolv|bankrupt)|withdrawal halt/i, -1.6, "Exchange stress"],
];

/** Very small, explainable headline sentiment scoring (course-project friendly). */
export function scoreNewsImpact(item: Pick<NewsItem, "title" | "body">): ImpactScore {
  const text = `${item.title ?? ""} ${item.body ?? ""}`.trim();
  if (!text) return { label: "neutral", score: 0, reasons: ["No text"] };

  let score = 0;
  const reasons: string[] = [];

  for (const [re, w, reason] of POSITIVE_KEYWORDS) {
    if (re.test(text)) {
      score += w;
      reasons.push(reason);
    }
  }
  for (const [re, w, reason] of NEGATIVE_KEYWORDS) {
    if (re.test(text)) {
      score += w;
      reasons.push(reason);
    }
  }

  // Clamp to keep UI stable.
  score = Math.max(-5, Math.min(5, Math.round(score * 10) / 10));
  const label: ImpactLabel = score > 0.4 ? "positive" : score < -0.4 ? "negative" : "neutral";
  return { label, score, reasons: reasons.slice(0, 3) };
}

export function aggregateImpact(scores: ImpactScore[]) {
  const total = scores.reduce((s, x) => s + x.score, 0);
  const avg = scores.length ? total / scores.length : 0;
  const rounded = Math.round(avg * 10) / 10;
  const label: ImpactLabel = rounded > 0.4 ? "positive" : rounded < -0.4 ? "negative" : "neutral";
  return { avgScore: rounded, label };
}

