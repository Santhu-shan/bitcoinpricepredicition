import { Bitcoin, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentPrice } from "@/lib/bitcoinApi";

const PriceHeader = () => {
  const { data: current, isLoading } = useQuery({
    queryKey: ["btc-current-header"],
    queryFn: fetchCurrentPrice,
    staleTime: 60 * 1000,
  });

  const isPositive = (current?.changePercent24h ?? 0) >= 0;

  return (
    <header className="border-b border-border px-6 py-4">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 glow-gold">
            <Bitcoin className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              BTC Price Prediction
            </h1>
            <p className="text-xs text-muted-foreground">AI / Machine Learning Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Current Price</p>
            {isLoading ? (
              <div className="h-8 w-28 animate-pulse rounded bg-muted" />
            ) : (
              <p className="font-mono text-2xl font-bold text-gradient-gold">
                ${current ? current.price.toLocaleString() : "—"}
              </p>
            )}
          </div>
          <div className={`flex items-center gap-1 rounded-lg px-3 py-2 ${isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="font-mono text-sm font-semibold">
              {current ? `${isPositive ? "+" : ""}${current.changePercent24h.toFixed(2)}%` : "—"}
            </span>
          </div>
          <div className="hidden items-center gap-1.5 sm:flex">
            <Activity className="h-3.5 w-3.5 text-primary animate-pulse-gold" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PriceHeader;
