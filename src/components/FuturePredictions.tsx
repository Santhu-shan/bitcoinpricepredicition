import { bitcoinDataset } from "@/data/bitcoinDataset";
import { runAllModels } from "@/lib/mlModels";
import { seedFromSeries } from "@/lib/csvPipeline";
import { Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";

const windowData = bitcoinDataset.slice(-365);
const prices = windowData.map((d) => d.price);
const results = runAllModels(prices, {
  lastDate: windowData[windowData.length - 1].date,
  seed: seedFromSeries(prices),
  futureDays: 30,
});
const lstm = results[2];
const lastClose = prices[prices.length - 1];

const horizonLabels: { label: string; i: number }[] = [
  { label: "Next day", i: 0 },
  { label: "3 days", i: 2 },
  { label: "1 week", i: 6 },
  { label: "2 weeks", i: 13 },
];

const futurePredictions = horizonLabels.map(({ label, i }) => {
  const price = lstm.futurePredictions[i];
  const prev = i === 0 ? lastClose : lstm.futurePredictions[i - 1];
  const up = price >= prev;
  return { date: label, lstm: price, confidence: Math.round(Math.min(99, Math.max(50, lstm.accuracy))), up };
});

const FuturePredictions = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold">LSTM horizon (from last close)</h2>
      </div>
      <p className="mb-3 text-[10px] text-muted-foreground">Snapshot of multi-step forecasts (365d training window)</p>
      <div className="space-y-3">
        {futurePredictions.map((pred) => (
          <div key={pred.date} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
            <div>
              <p className="text-xs text-muted-foreground">{pred.date}</p>
              <p className="font-mono text-lg font-bold text-gradient-gold">
                ${pred.lstm.toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className={`flex items-center gap-1 ${pred.up ? "text-success" : "text-destructive"}`}>
                {pred.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                <span className="font-mono text-xs font-semibold">{pred.up ? "Up" : "Down"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${pred.confidence}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">{pred.confidence}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FuturePredictions;
