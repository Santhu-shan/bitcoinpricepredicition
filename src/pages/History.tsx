import { useQuery } from "@tanstack/react-query";
import { fetchCurrentPrice } from "@/lib/bitcoinApi";
import { bitcoinDataset, datasetInfo } from "@/data/bitcoinDataset";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, ComposedChart, Line } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, Layers, Shield, Globe, Database } from "lucide-react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

const timeRanges = [
  { label: "90D", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "All", days: 0 },
];

const History = () => {
  const [days, setDays] = useState(365);
  const [showSMA, setShowSMA] = useState(true);
  const [showVolume, setShowVolume] = useState(false);

  const { data: current, isLoading: currentLoading } = useQuery({
    queryKey: ["btc-current"],
    queryFn: fetchCurrentPrice,
    staleTime: 60 * 1000,
  });

  // Use embedded Kaggle dataset (real historical data)
  const history = useMemo(() => {
    if (days === 0) return bitcoinDataset;
    return bitcoinDataset.slice(-days);
  }, [days]);

  const chartData = useMemo(() => {
    return history.map((d, i, arr) => {
      const sma7 = i >= 6 ? arr.slice(i - 6, i + 1).reduce((s, x) => s + x.price, 0) / 7 : null;
      const sma21 = i >= 20 ? arr.slice(i - 20, i + 1).reduce((s, x) => s + x.price, 0) / 21 : null;
      return {
        date: d.date.slice(5),
        fullDate: d.date,
        price: d.price,
        volume: d.volume / 1e9,
        marketCap: d.marketCap / 1e9,
        sma7: sma7 ? Math.round(sma7) : undefined,
        sma21: sma21 ? Math.round(sma21) : undefined,
      };
    });
  }, [history]);

  const isPositive = (current?.changePercent24h ?? 0) >= 0;

  const priceStats = useMemo(() => {
    if (history.length < 2) return null;
    const prices = history.map(h => h.price);
    const highest = Math.max(...prices);
    const lowest = Math.min(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const volatility = Math.sqrt(
      prices.slice(1).reduce((sum, p, i) => {
        const ret = Math.log(p / prices[i]);
        return sum + ret * ret;
      }, 0) / (prices.length - 1)
    ) * Math.sqrt(365) * 100;
    return { highest, lowest, avg, volatility };
  }, [history]);

  return (
    <div className="min-h-screen bg-background bg-grid">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        {/* Dataset Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-primary/20 bg-primary/5 p-4 glow-gold"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs font-semibold text-primary">Real-World Bitcoin Dataset (Kaggle)</p>
                <p className="text-[10px] text-muted-foreground">
                  {datasetInfo.totalSamples} samples • {datasetInfo.startDate} to {datasetInfo.endDate} • Source: {datasetInfo.source}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="rounded-md bg-card px-2 py-1 font-mono">Min: ${datasetInfo.minPrice.toLocaleString()}</span>
              <span className="rounded-md bg-card px-2 py-1 font-mono">Max: ${datasetInfo.maxPrice.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        {/* Hero Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <StatCard label="Current Price" value={current ? `$${current.price.toLocaleString()}` : "—"} icon={DollarSign} loading={currentLoading} highlight />
          <StatCard label="24h Change" value={current ? `${isPositive ? "+" : ""}${current.changePercent24h.toFixed(2)}%` : "—"} icon={isPositive ? TrendingUp : TrendingDown} loading={currentLoading} positive={isPositive} />
          <StatCard label="Market Cap" value={current ? `$${(current.marketCap / 1e12).toFixed(2)}T` : "—"} icon={Globe} loading={currentLoading} />
          <StatCard label="24h Volume" value={current ? `$${(current.volume24h / 1e9).toFixed(1)}B` : "—"} icon={BarChart3} loading={currentLoading} />
        </motion.div>

        {priceStats && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label={`${days === 0 ? "All" : days + "D"} High`} value={`$${priceStats.highest.toLocaleString()}`} />
            <MiniStat label={`${days === 0 ? "All" : days + "D"} Low`} value={`$${priceStats.lowest.toLocaleString()}`} />
            <MiniStat label={`${days === 0 ? "All" : days + "D"} Avg`} value={`$${Math.round(priceStats.avg).toLocaleString()}`} />
            <MiniStat label="Ann. Volatility" value={`${priceStats.volatility.toFixed(1)}%`} />
          </motion.div>
        )}

        {/* Main Price Chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-border bg-card p-5 card-hover">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold">Bitcoin Price History</h2>
                <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Shield className="h-3 w-3" /> Real dataset — {history.length} data points
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 mr-2">
                <button onClick={() => setShowSMA(!showSMA)} className={`rounded-md px-2 py-1 text-[10px] font-medium transition-all ${showSMA ? "bg-chart-blue/20 text-chart-blue" : "bg-muted text-muted-foreground"}`}>SMA</button>
                <button onClick={() => setShowVolume(!showVolume)} className={`rounded-md px-2 py-1 text-[10px] font-medium transition-all ${showVolume ? "bg-chart-purple/20 text-chart-purple" : "bg-muted text-muted-foreground"}`}>VOL</button>
              </div>
              <div className="flex gap-1 rounded-xl bg-muted p-1">
                {timeRanges.map((r) => (
                  <button key={r.label} onClick={() => setDays(r.days)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${days === r.days ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{r.label}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(43 100% 50%)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(43 100% 50%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(280 73% 60%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(280 73% 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 14% 11%)" />
                <XAxis dataKey="date" stroke="hsl(225 10% 30%)" fontSize={10} tickLine={false} interval={Math.floor(chartData.length / 7)} />
                <YAxis yAxisId="price" stroke="hsl(225 10% 30%)" fontSize={10} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} domain={["dataMin - 2000", "dataMax + 2000"]} />
                {showVolume && <YAxis yAxisId="vol" orientation="right" stroke="hsl(225 10% 20%)" fontSize={9} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}B`} />}
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(225 22% 8%)", border: "1px solid hsl(225 14% 15%)", borderRadius: "12px", fontSize: "11px", boxShadow: "0 8px 32px hsl(0 0% 0% / 0.4)" }}
                  labelStyle={{ color: "hsl(40 15% 93%)", marginBottom: "4px", fontWeight: 600 }}
                  formatter={(value: number, name: string) => {
                    if (name === "volume") return [`$${value.toFixed(1)}B`, "Volume"];
                    return [`$${value.toLocaleString()}`, name === "price" ? "Price" : name];
                  }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ""}
                />
                {showVolume && <Bar yAxisId="vol" dataKey="volume" fill="url(#volGradient)" radius={[2, 2, 0, 0]} opacity={0.5} />}
                <Area yAxisId="price" type="monotone" dataKey="price" stroke="hsl(43 100% 50%)" strokeWidth={2} fill="url(#priceGradient)" />
                {showSMA && (
                  <>
                    <Line yAxisId="price" type="monotone" dataKey="sma7" stroke="hsl(217 91% 60%)" strokeWidth={1.5} dot={false} strokeDasharray="4 3" connectNulls />
                    <Line yAxisId="price" type="monotone" dataKey="sma21" stroke="hsl(160 84% 39%)" strokeWidth={1.5} dot={false} strokeDasharray="6 3" connectNulls />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border pt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-primary" /> Price</span>
            {showSMA && (
              <>
                <span className="flex items-center gap-1.5"><span className="h-px w-4 border-t-2 border-dashed border-chart-blue" /> SMA 7</span>
                <span className="flex items-center gap-1.5"><span className="h-px w-4 border-t-2 border-dashed border-chart-green" /> SMA 21</span>
              </>
            )}
            {showVolume && <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm bg-chart-purple/40" /> Volume</span>}
          </div>
        </motion.div>

        {/* Volume + Market Cap */}
        <div className="grid gap-5 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-5 card-hover">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-blue/10">
                <BarChart3 className="h-3.5 w-3.5 text-chart-blue" />
              </div>
              <h2 className="font-display text-sm font-semibold">Trading Volume (60D)</h2>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.slice(-60)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 14% 11%)" />
                  <XAxis dataKey="date" stroke="hsl(225 10% 30%)" fontSize={9} tickLine={false} interval={8} />
                  <YAxis stroke="hsl(225 10% 30%)" fontSize={9} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}B`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(225 22% 8%)", border: "1px solid hsl(225 14% 15%)", borderRadius: "12px", fontSize: "11px" }} formatter={(value: number) => [`$${value.toFixed(1)}B`, "Volume"]} />
                  <Bar dataKey="volume" fill="hsl(217 91% 60% / 0.5)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl border border-border bg-card p-5 card-hover">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-purple/10">
                <Layers className="h-3.5 w-3.5 text-chart-purple" />
              </div>
              <h2 className="font-display text-sm font-semibold">Market Capitalization</h2>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="mcapGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(280 73% 60%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(280 73% 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 14% 11%)" />
                  <XAxis dataKey="date" stroke="hsl(225 10% 30%)" fontSize={9} tickLine={false} interval={Math.floor(chartData.length / 6)} />
                  <YAxis stroke="hsl(225 10% 30%)" fontSize={9} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}T`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(225 22% 8%)", border: "1px solid hsl(225 14% 15%)", borderRadius: "12px", fontSize: "11px" }} formatter={(value: number) => [`$${value.toFixed(0)}B`, "Market Cap"]} />
                  <Area type="monotone" dataKey="marketCap" stroke="hsl(280 73% 60%)" strokeWidth={1.5} fill="url(#mcapGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Data Table */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 font-display text-sm font-semibold">Recent Price Data (Last 30 Days)</h2>
          <div className="max-h-[320px] overflow-auto scrollbar-thin">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5 text-right">Price (USD)</th>
                  <th className="px-3 py-2.5 text-right hidden sm:table-cell">Volume</th>
                  <th className="px-3 py-2.5 text-right hidden sm:table-cell">Market Cap</th>
                  <th className="px-3 py-2.5 text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().slice(0, 30).map((d, i, arr) => {
                  const prev = i < arr.length - 1 ? arr[i + 1] : null;
                  const change = prev ? ((d.price - prev.price) / prev.price) * 100 : 0;
                  return (
                    <tr key={d.date} className="border-b border-border/30 transition-colors hover:bg-muted/20">
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{d.date}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold">${d.price.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-muted-foreground hidden sm:table-cell">${(d.volume / 1e9).toFixed(1)}B</td>
                      <td className="px-3 py-2.5 text-right font-mono text-muted-foreground hidden sm:table-cell">${(d.marketCap / 1e9).toFixed(0)}B</td>
                      <td className={`px-3 py-2.5 text-right font-mono font-semibold ${change >= 0 ? "text-success" : "text-destructive"}`}>
                        {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        <footer className="border-t border-border py-5 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          AI-Based Bitcoin Price Prediction — ML Course Project • Data: Kaggle Bitcoin Historical Dataset
        </footer>
      </main>
    </div>
  );
};

function StatCard({ label, value, icon: Icon, loading, highlight, positive }: {
  label: string; value: string; icon: any; loading?: boolean; highlight?: boolean; positive?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 transition-all duration-300 ${highlight ? "border-primary/20 bg-primary/5 glow-gold" : "border-border bg-card card-hover"}`}>
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${positive === true ? "text-success" : positive === false ? "text-destructive" : "text-primary"}`} />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      {loading ? (
        <div className="h-7 w-24 animate-pulse rounded-lg bg-muted" />
      ) : (
        <p className={`font-mono text-lg font-bold ${highlight ? "text-gradient-gold" : positive === false ? "text-destructive" : "text-foreground"}`}>{value}</p>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 px-4 py-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}

export default History;
