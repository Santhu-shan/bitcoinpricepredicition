import { bitcoinDataset } from "@/data/bitcoinDataset";
import { runAllModels } from "@/lib/mlModels";
import { seedFromSeries } from "@/lib/csvPipeline";
import { Trophy, BarChart3 } from "lucide-react";

const windowData = bitcoinDataset.slice(-365);
const prices = windowData.map((d) => d.price);
const modelResults = runAllModels(prices, {
  lastDate: windowData[windowData.length - 1].date,
  seed: seedFromSeries(prices),
  futureDays: 30,
});

const modelMetrics = modelResults.map((r) => ({
  name: r.modelName,
  mae: r.mae,
  rmse: r.rmse,
  r2: r.r2,
  accuracy: r.accuracy,
  color:
    r.modelName === "Linear Regression"
      ? "hsl(var(--chart-blue))"
      : r.modelName === "Random Forest"
        ? "hsl(var(--chart-purple))"
        : "hsl(var(--chart-green))",
}));

const bestName = modelMetrics.reduce((a, b) => (a.accuracy >= b.accuracy ? a : b)).name;

const ModelComparison = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold">Model Performance</h2>
      </div>
      <p className="mb-3 text-[10px] text-muted-foreground">Trained on last 365 days of embedded dataset (test metrics from 20% holdout)</p>
      <div className="space-y-3">
        {modelMetrics.map((model) => (
          <div
            key={model.name}
            className={`rounded-lg border p-4 transition-all ${
              model.name === bestName ? "border-success/30 bg-success/5 glow-gold" : "border-border bg-muted/30"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: model.color }} />
                <span className="text-sm font-medium">{model.name}</span>
              </div>
              {model.name === bestName && <Trophy className="h-4 w-4 text-primary" />}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">MAE</p>
                <p className="font-mono text-sm font-semibold">${model.mae.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">RMSE</p>
                <p className="font-mono text-sm font-semibold">${model.rmse.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">R² Score</p>
                <p className="font-mono text-sm font-semibold">{model.r2.toFixed(2)}</p>
              </div>
            </div>
            {/* R² bar */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, Math.max(0, model.r2 * 100))}%`, backgroundColor: model.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelComparison;
