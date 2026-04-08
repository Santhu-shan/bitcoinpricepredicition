import Navbar from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { fetchBitcoinHistory, fetchCurrentPrice, fetchGlobalMarketData } from "@/lib/bitcoinApi";
import { runAllModels, computeTrendAnalysis } from "@/lib/mlModels";
import { seedFromSeries } from "@/lib/csvPipeline";
import { calculateRSI, annualizedVolatilityPct } from "@/lib/indicators";
import { fetchBitcoinNews, scoreNewsImpact, aggregateImpact } from "@/lib/newsApi";
import { motion } from "framer-motion";
import {
  Globe, Newspaper, TrendingUp, TrendingDown, Minus, Activity, ShieldAlert, Scale,
  ShoppingCart, HandCoins, LineChart as LineChartIcon, Sparkles,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

type Decision = "Buy" | "Hold" | "Sell";

function decisionColor(d: Decision) {
  if (d === "Buy") return "text-success";
  if (d === "Sell") return "text-destructive";
  return "text-muted-foreground";
}

function impactBadge(label: "positive" | "negative" | "neutral") {
  if (label === "positive") return "bg-success/10 text-success border-success/20";
  if (label === "negative") return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-muted/50 text-muted-foreground border-border";
}

function trendIcon(direction: "up" | "down" | "sideways") {
  if (direction === "up") return <TrendingUp className="h-4 w-4 text-success" />;
  if (direction === "down") return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function makeDecision(params: {
  rsi: number | null;
  trendDirection: "up" | "down" | "sideways";
  newsImpact: { avgScore: number; label: "positive" | "negative" | "neutral" };
}) {
  const reasons: string[] = [];
  const { rsi, trendDirection, newsImpact } = params;

  // RSI rules (common TA heuristic)
  if (rsi !== null) {
    if (rsi <= 30) reasons.push(`RSI ${rsi} (oversold bias)`);
    if (rsi >= 70) reasons.push(`RSI ${rsi} (overbought bias)`);
  } else {
    reasons.push("RSI unavailable (insufficient data)");
  }

  // Trend rules
  if (trendDirection === "up") reasons.push("Price trend is up");
  if (trendDirection === "down") reasons.push("Price trend is down");
  if (trendDirection === "sideways") reasons.push("Price trend is sideways");

  // News impact
  reasons.push(`News impact: ${newsImpact.label} (${newsImpact.avgScore})`);

  // Combine (simple, explainable)
  let decision: Decision = "Hold";
  let confidence = 55;

  if (rsi !== null && rsi <= 30 && newsImpact.avgScore >= -0.2) {
    decision = "Buy";
    confidence = trendDirection === "up" ? 72 : 64;
  } else if (rsi !== null && rsi >= 70 && newsImpact.avgScore <= 0.2) {
    decision = "Sell";
    confidence = trendDirection === "down" ? 72 : 64;
  } else if (trendDirection === "down" && newsImpact.avgScore < -0.6) {
    decision = "Sell";
    confidence = 68;
  } else if (trendDirection === "up" && newsImpact.avgScore > 0.6 && (rsi === null || rsi < 70)) {
    decision = "Buy";
    confidence = 67;
  }

  return { decision, confidence, reasons: reasons.slice(0, 4) };
}

const Insights = () => {
  const { data: current } = useQuery({
    queryKey: ["btc-current"],
    queryFn: fetchCurrentPrice,
    staleTime: 60 * 1000,
  });

  const { data: global } = useQuery({
    queryKey: ["cg-global"],
    queryFn: fetchGlobalMarketData,
    staleTime: 10 * 60 * 1000,
  });

  const { data: history, isLoading: historyLoading, error: historyError } = useQuery({
    queryKey: ["btc-history-live", 365],
    queryFn: () => fetchBitcoinHistory(365),
    staleTime: 30 * 60 * 1000,
  });

  const { data: news, error: newsError } = useQuery({
    queryKey: ["btc-news"],
    queryFn: () => fetchBitcoinNews(25),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const closes = history?.map((d) => d.price) ?? [];
  const lastDate = history?.[history.length - 1]?.date;

  const trend = closes.length ? computeTrendAnalysis(closes.slice(-90)) : null;
  const rsi = closes.length ? calculateRSI(closes, 14) : null;
  const vol = closes.length ? annualizedVolatilityPct(closes.slice(-90)) : null;

  const scored = (news ?? []).map((n) => ({ n, impact: scoreNewsImpact(n) }));
  const newsAgg = aggregateImpact(scored.map((x) => x.impact));

  const decision = makeDecision({
    rsi,
    trendDirection: trend?.direction ?? "sideways",
    newsImpact: newsAgg,
  });

  const results =
    closes.length >= 30
      ? runAllModels(closes, { futureDays: 30, lastDate, seed: seedFromSeries(closes) })
      : null;

  const best = results?.reduce((a, b) => (a.accuracy >= b.accuracy ? a : b), results[0]);

  const forecastChart =
    results?.[0].futureDates.map((d, i) => ({
      date: d.slice(5),
      fullDate: d,
      "Linear Regression": results[0].futurePredictions[i],
      "Random Forest": results[1].futurePredictions[i],
      "LSTM Neural Network": results[2].futurePredictions[i],
    })) ?? [];

  return (
    <div className="min-h-screen bg-background bg-grid">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-primary/20 bg-primary/5 p-5 glow-gold"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Live macro + news + ML</p>
              <h1 className="font-display text-xl font-bold">
                Market <span className="text-gradient-gold">Insights</span>
              </h1>
              <p className="mt-1 text-xs text-muted-foreground max-w-2xl leading-relaxed">
                This page combines: global crypto market snapshot, current headlines that can affect Bitcoin sentiment, technical
                indicators (trend/RSI/volatility), and a 30‑day forecast from the same three models used elsewhere.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-xl bg-card px-4 py-3">
                <p className="text-[10px] text-muted-foreground">BTC price</p>
                <p className="font-mono text-lg font-bold">{current ? `$${current.price.toLocaleString()}` : "—"}</p>
              </div>
              <div className="rounded-xl bg-card px-4 py-3">
                <p className="text-[10px] text-muted-foreground">Decision</p>
                <p className={`font-mono text-lg font-bold ${decisionColor(decision.decision)}`}>{decision.decision}</p>
                <p className="text-[10px] text-muted-foreground">{decision.confidence}% confidence</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-3">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 rounded-2xl border border-border bg-card p-5"
          >
            <div className="mb-4 flex items-center gap-2.5">
              <LineChartIcon className="h-4 w-4 text-primary" />
              <div>
                <h2 className="font-display text-sm font-semibold">30‑day forecast (live CoinGecko history)</h2>
                <p className="text-[10px] text-muted-foreground">
                  Trained on last {closes.length} daily closes • 80/20 temporal split • Best model: {best?.modelName ?? "—"}
                </p>
              </div>
            </div>

            {historyLoading ? (
              <div className="h-[320px] rounded-xl bg-muted/30 animate-pulse" />
            ) : historyError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                Failed to load CoinGecko history.
              </div>
            ) : (
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 14% 11%)" />
                    <XAxis dataKey="date" stroke="hsl(225 10% 30%)" fontSize={10} tickLine={false} interval={2} />
                    <YAxis stroke="hsl(225 10% 30%)" fontSize={10} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(225 22% 8%)", border: "1px solid hsl(225 14% 15%)", borderRadius: "12px", fontSize: "11px" }}
                      labelFormatter={(_, p) => p?.[0]?.payload?.fullDate ?? ""}
                      formatter={(v: number, name: string) => [`$${v.toLocaleString()}`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Line type="monotone" dataKey="Linear Regression" stroke="hsl(217 91% 60%)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="Random Forest" stroke="hsl(280 73% 60%)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="LSTM Neural Network" stroke="hsl(160 84% 39%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="mb-4 flex items-center gap-2.5">
              <Scale className="h-4 w-4 text-primary" />
              <div>
                <h2 className="font-display text-sm font-semibold">Signals</h2>
                <p className="text-[10px] text-muted-foreground">Trend/RSI/Volatility + news impact</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Trend (last 90d)</p>
                  {trend ? trendIcon(trend.direction) : <Activity className="h-4 w-4 text-muted-foreground" />}
                </div>
                <p className="mt-1 text-sm font-semibold capitalize">{trend?.direction ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground">
                  {trend ? `${trend.slopePerDay} USD/day · ${trend.cumulativeReturnPct}% return` : "Waiting for data"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">RSI (14)</p>
                <p className="mt-1 font-mono text-2xl font-bold">{rsi ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground">
                  {rsi === null ? "Need more history" : rsi <= 30 ? "Oversold bias" : rsi >= 70 ? "Overbought bias" : "Neutral"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Volatility (ann.)</p>
                <p className="mt-1 font-mono text-2xl font-bold">{vol ? `${vol}%` : "—"}</p>
                <p className="text-[10px] text-muted-foreground">Computed from log returns (last 90 days)</p>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">News impact</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] ${impactBadge(newsAgg.label)}`}>
                    {newsAgg.label} ({newsAgg.avgScore})
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                  Headline scoring is heuristic (keyword-based) and intended for coursework explainability.
                </p>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  {decision.decision === "Buy" ? (
                    <ShoppingCart className="h-4 w-4 text-success" />
                  ) : decision.decision === "Sell" ? (
                    <HandCoins className="h-4 w-4 text-destructive" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  )}
                  <p className="text-sm font-semibold">
                    Recommendation: <span className={decisionColor(decision.decision)}>{decision.decision}</span>
                  </p>
                </div>
                <ul className="list-disc pl-5 text-[11px] text-muted-foreground space-y-1">
                  {decision.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                <p className="mt-3 text-[10px] text-muted-foreground">
                  Disclaimer: educational analysis only (not financial advice).
                </p>
              </div>
            </div>
          </motion.section>
        </div>

        <div className="grid gap-5 lg:grid-cols-5">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 rounded-2xl border border-border bg-card p-5"
          >
            <div className="mb-4 flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-primary" />
              <div>
                <h2 className="font-display text-sm font-semibold">Global crypto snapshot</h2>
                <p className="text-[10px] text-muted-foreground">CoinGecko global endpoint</p>
              </div>
            </div>

            {!global ? (
              <div className="h-28 rounded-xl bg-muted/30 animate-pulse" />
            ) : (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Info label="BTC dominance" value={`${global.btcDominancePct.toFixed(1)}%`} />
                <Info label="Market cap 24h" value={`${global.marketCapChangePct24hUsd.toFixed(2)}%`} />
                <Info label="Total mcap" value={`$${(global.totalMarketCapUsd / 1e12).toFixed(2)}T`} />
                <Info label="Total volume" value={`$${(global.totalVolumeUsd / 1e9).toFixed(0)}B`} />
                <Info label="Active assets" value={`${global.activeCryptocurrencies}`} />
                <Info label="Markets" value={`${global.markets}`} />
              </div>
            )}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3 rounded-2xl border border-border bg-card p-5"
          >
            <div className="mb-4 flex items-center gap-2.5">
              <Newspaper className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <h2 className="font-display text-sm font-semibold">News & impact analysis</h2>
                <p className="text-[10px] text-muted-foreground">Classifies headlines as positive/negative/neutral for BTC trend</p>
              </div>
              {newsError && (
                <span className="flex items-center gap-1 rounded-full border border-destructive/20 bg-destructive/5 px-2 py-1 text-[10px] text-destructive">
                  <ShieldAlert className="h-3 w-3" /> News blocked
                </span>
              )}
            </div>

            {newsError ? (
              <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
                Your browser blocked the news endpoint (CORS) or it rate-limited. The rest of the page still uses live CoinGecko data.
                If you want guaranteed news, we can add a tiny Node proxy endpoint in this project.
              </div>
            ) : (
              <div className="max-h-[420px] overflow-auto scrollbar-thin space-y-2 pr-1">
                {scored.map(({ n, impact }) => (
                  <a
                    key={n.url}
                    href={n.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl border border-border bg-muted/20 p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold leading-snug">{n.title}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {n.source} • {new Date(n.publishedAt).toLocaleString()}
                        </p>
                        {impact.reasons.length > 0 && (
                          <p className="mt-2 text-[10px] text-muted-foreground">
                            Signals: {impact.reasons.join(", ")}
                          </p>
                        )}
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${impactBadge(impact.label)}`}>
                        {impact.label} ({impact.score})
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </motion.section>
        </div>

        <footer className="border-t border-border py-5 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          Live data: CoinGecko (price/history/global) • News: CryptoCompare (if accessible) • Recommendation: educational only
        </footer>
      </main>
    </div>
  );
};

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}

export default Insights;

