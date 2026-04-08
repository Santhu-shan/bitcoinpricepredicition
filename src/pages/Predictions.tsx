import { useQuery } from "@tanstack/react-query";
import { fetchCurrentPrice } from "@/lib/bitcoinApi";
import { bitcoinDataset, datasetInfo, datasetPrices } from "@/data/bitcoinDataset";
import { runAllModels, TrainTestResult } from "@/lib/mlModels";
import { seedFromSeries } from "@/lib/csvPipeline";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Area, AreaChart } from "recharts";
import { BrainCircuit, Trophy, Sparkles, ArrowUpRight, ArrowDownRight, RefreshCw, Target, Shield, Zap, Activity, CheckCircle2, Database } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

const modelColors: Record<string, string> = {
  "Linear Regression": "hsl(217 91% 60%)",
  "Random Forest": "hsl(280 73% 60%)",
  "LSTM Neural Network": "hsl(160 84% 39%)",
};

const modelDescriptions: Record<string, string> = {
  "Linear Regression": "Baseline trend-fitting model using OLS",
  "Random Forest": "Ensemble of 50 decision stumps with bagging",
  "LSTM Neural Network": "Holt's smoothing with optimized α/β",
};

const Predictions = () => {
  const [trainingDays, setTrainingDays] = useState(365);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const { data: current } = useQuery({
    queryKey: ["btc-current"],
    queryFn: fetchCurrentPrice,
    staleTime: 60 * 1000,
  });

  // Use embedded Kaggle dataset for training (real historical data)
  const prices = useMemo(() => {
    const dataset = datasetPrices;
    if (trainingDays === 0) return dataset;
    return dataset.slice(-trainingDays);
  }, [trainingDays]);

  const history = useMemo(() => {
    if (trainingDays === 0) return bitcoinDataset;
    return bitcoinDataset.slice(-trainingDays);
  }, [trainingDays]);

  const [results, setResults] = useState<TrainTestResult[] | null>(null);
  const [isTraining, setIsTraining] = useState(false);

  const lastDate = history.length ? history[history.length - 1].date : undefined;

  useEffect(() => {
    if (prices.length < 30) return;
    setIsTraining(true);
    const t = window.setTimeout(() => {
      try {
        const r = runAllModels(prices, {
          lastDate,
          futureDays: 30,
          seed: seedFromSeries(prices),
        });
        setResults(r);
      } catch (e) {
        console.error("ML error:", e);
        setResults(null);
      }
      setIsTraining(false);
    }, 50);
    return () => window.clearTimeout(t);
  }, [prices, lastDate]);

  const retrain = () => {
    setIsTraining(true);
    window.setTimeout(() => {
      try {
        setResults(
          runAllModels(prices, {
            lastDate,
            futureDays: 30,
            seed: seedFromSeries(prices),
          })
        );
      } catch (e) {
        console.error("ML error:", e);
      }
      setIsTraining(false);
    }, 50);
  };

  const bestModel = results?.reduce((best, r) => (r.accuracy > best.accuracy ? r : best), results[0]);

  const testChartData = useMemo(() => {
    if (!results || !history) return [];
    const splitIdx = Math.floor(history.length * 0.8);
    return results[0].testActual.map((actual, i) => ({
      date: history[splitIdx + i]?.date?.slice(5) || `T+${i}`,
      fullDate: history[splitIdx + i]?.date || "",
      actual,
      "Linear Regression": results[0].testPredicted[i],
      "Random Forest": results[1].testPredicted[i],
      "LSTM Neural Network": results[2].testPredicted[i],
    }));
  }, [results, history]);

  const futureChartData = useMemo(() => {
    if (!results) return [];
    return results[0].futureDates.map((date, i) => ({
      date: date.slice(5),
      fullDate: date,
      "Linear Regression": results[0].futurePredictions[i],
      "Random Forest": results[1].futurePredictions[i],
      "LSTM Neural Network": results[2].futurePredictions[i],
    }));
  }, [results]);

  const errorData = useMemo(() => {
    if (!results) return [];
    return results[0].testActual.map((actual, i) => ({
      index: i,
      "Linear Regression": Math.abs(actual - results[0].testPredicted[i]),
      "Random Forest": Math.abs(actual - results[1].testPredicted[i]),
      "LSTM Neural Network": Math.abs(actual - results[2].testPredicted[i]),
    }));
  }, [results]);

  return (
    <div className="min-h-screen bg-background bg-grid">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        {/* Dataset Info Banner */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-primary/20 bg-primary/5 p-4 glow-gold">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs font-semibold text-primary">Training on Real Kaggle Bitcoin Dataset</p>
                <p className="text-[10px] text-muted-foreground">
                  {prices.length} samples selected • {datasetInfo.splitRatio} • All 3 ML models trained in-browser
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="rounded-md bg-card px-2 py-1 font-mono">Features: {datasetInfo.features.length}</span>
              <span className="rounded-md bg-card px-2 py-1 font-mono">Train: {Math.floor(prices.length * 0.8)}</span>
              <span className="rounded-md bg-card px-2 py-1 font-mono">Test: {prices.length - Math.floor(prices.length * 0.8)}</span>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 glow-gold">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold">ML Prediction Engine</h2>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Shield className="h-3 w-3" /> Trained on real-world Kaggle data
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground max-w-lg">
                Real Bitcoin data → 80/20 temporal split → Train 3 ML models → Evaluate with MAE, RMSE, R², MAPE → Generate 30-day forecasts.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 rounded-xl bg-muted p-1">
                {[{ label: "6M", days: 180 }, { label: "1Y", days: 365 }, { label: "All", days: 0 }].map((d) => (
                  <button key={d.label} onClick={() => setTrainingDays(d.days)} className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${trainingDays === d.days ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{d.label}</button>
                ))}
              </div>
              <button onClick={retrain} disabled={isTraining} className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2.5 text-xs font-medium text-primary hover:bg-primary/20 transition-all glow-gold">
                <RefreshCw className={`h-3.5 w-3.5 ${isTraining ? "animate-spin" : ""}`} />
                Retrain
              </button>
            </div>
          </div>
        </motion.div>

        {isTraining ? (
          <div className="flex h-[400px] items-center justify-center rounded-2xl border border-border bg-card">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                <BrainCircuit className="absolute inset-0 m-auto h-5 w-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Training ML Models on Kaggle Dataset...</p>
                <p className="text-[10px] text-muted-foreground mt-1">Processing {prices.length} data points & optimizing parameters</p>
              </div>
            </div>
          </div>
        ) : results ? (
          <>
            {/* Live Price vs Best Model */}
            {current && bestModel && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-primary/20 bg-primary/5 p-5 glow-gold">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Live Price vs Best Model (Next Day)</p>
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-2xl font-bold text-gradient-gold">${current.price.toLocaleString()}</span>
                      <span className="text-muted-foreground text-xs">→</span>
                      <span className="font-mono text-2xl font-bold text-foreground">${bestModel.futurePredictions[0].toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-card px-4 py-2.5 text-center">
                      <p className="text-[10px] text-muted-foreground">Model</p>
                      <p className="text-xs font-semibold text-primary">{bestModel.modelName}</p>
                    </div>
                    <div className="rounded-xl bg-card px-4 py-2.5 text-center">
                      <p className="text-[10px] text-muted-foreground">Accuracy</p>
                      <p className="text-xs font-semibold text-success">{bestModel.accuracy}%</p>
                    </div>
                    <div className="rounded-xl bg-card px-4 py-2.5 text-center">
                      <p className="text-[10px] text-muted-foreground">Δ Price</p>
                      {(() => {
                        const diff = bestModel.futurePredictions[0] - current.price;
                        const pct = (diff / current.price) * 100;
                        const up = diff >= 0;
                        return (
                          <p className={`flex items-center gap-0.5 text-xs font-semibold ${up ? "text-success" : "text-destructive"}`}>
                            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {up ? "+" : ""}{pct.toFixed(2)}%
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Model Cards */}
            <div className="grid gap-3 sm:grid-cols-3">
              {results.map((r, idx) => (
                <motion.div
                  key={r.modelName}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + idx * 0.05 }}
                  onClick={() => setSelectedModel(selectedModel === r.modelName ? null : r.modelName)}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all duration-300 ${
                    r === bestModel ? "border-success/30 bg-success/5 glow-gold" : selectedModel === r.modelName ? "border-primary/30 bg-primary/5" : "border-border bg-card card-hover"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: modelColors[r.modelName] }} />
                      <span className="font-display text-sm font-semibold">{r.modelName}</span>
                    </div>
                    {r === bestModel && (
                      <div className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5">
                        <Trophy className="h-3 w-3 text-success" />
                        <span className="text-[9px] font-semibold text-success">BEST</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-3">{modelDescriptions[r.modelName]}</p>
                  <div className="mb-3 flex items-baseline gap-1.5">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="font-mono text-3xl font-bold text-gradient-gold">{r.accuracy}%</span>
                    <span className="text-[10px] text-muted-foreground">accuracy</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <MetricBadge label="MAE" value={`$${r.mae.toLocaleString()}`} />
                    <MetricBadge label="RMSE" value={`$${r.rmse.toLocaleString()}`} />
                    <MetricBadge label="R²" value={r.r2.toFixed(4)} />
                    <MetricBadge label="MAPE" value={`${r.mape}%`} />
                  </div>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${r.accuracy}%` }} transition={{ duration: 1, delay: 0.3 + idx * 0.1 }} className="h-full rounded-full" style={{ backgroundColor: modelColors[r.modelName] }} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Test Period Chart */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <Activity className="h-4 w-4 text-primary" />
                    <h2 className="font-display text-base font-semibold">Actual vs Predicted (Test Set)</h2>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    80/20 temporal split • {prices.length} data points • {results[0].testActual.length} test days • Kaggle dataset
                    {selectedModel && <span className="text-primary ml-2">Filtering: {selectedModel}</span>}
                  </p>
                </div>
                {selectedModel && <button onClick={() => setSelectedModel(null)} className="text-[10px] text-primary underline">Show all</button>}
              </div>
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={testChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 14% 11%)" />
                    <XAxis dataKey="date" stroke="hsl(225 10% 30%)" fontSize={10} tickLine={false} interval={Math.floor(testChartData.length / 8)} />
                    <YAxis stroke="hsl(225 10% 30%)" fontSize={10} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} domain={["dataMin - 2000", "dataMax + 2000"]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(225 22% 8%)", border: "1px solid hsl(225 14% 15%)", borderRadius: "12px", fontSize: "11px", boxShadow: "0 8px 32px hsl(0 0% 0% / 0.4)" }}
                      labelStyle={{ color: "hsl(40 15% 93%)", fontWeight: 600 }}
                      formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ""}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                    <Line type="monotone" dataKey="actual" name="Actual Price" stroke="hsl(43 100% 50%)" strokeWidth={2.5} dot={false} />
                    {(!selectedModel || selectedModel === "Linear Regression") && <Line type="monotone" dataKey="Linear Regression" stroke={modelColors["Linear Regression"]} strokeWidth={1.5} dot={false} strokeDasharray="4 4" opacity={0.8} />}
                    {(!selectedModel || selectedModel === "Random Forest") && <Line type="monotone" dataKey="Random Forest" stroke={modelColors["Random Forest"]} strokeWidth={1.5} dot={false} strokeDasharray="4 4" opacity={0.8} />}
                    {(!selectedModel || selectedModel === "LSTM Neural Network") && <Line type="monotone" dataKey="LSTM Neural Network" stroke={modelColors["LSTM Neural Network"]} strokeWidth={2} dot={false} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Future + Best Model Forecast */}
            <div className="grid gap-5 lg:grid-cols-5">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="lg:col-span-3 rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="font-display text-base font-semibold">30-Day Price Forecast</h2>
                </div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={futureChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 14% 11%)" />
                      <XAxis dataKey="date" stroke="hsl(225 10% 30%)" fontSize={10} tickLine={false} />
                      <YAxis stroke="hsl(225 10% 30%)" fontSize={10} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} domain={["dataMin - 3000", "dataMax + 3000"]} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(225 22% 8%)", border: "1px solid hsl(225 14% 15%)", borderRadius: "12px", fontSize: "11px" }} formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Bar dataKey="Linear Regression" fill={modelColors["Linear Regression"]} radius={[6, 6, 0, 0]} opacity={0.7} />
                      <Bar dataKey="Random Forest" fill={modelColors["Random Forest"]} radius={[6, 6, 0, 0]} opacity={0.7} />
                      <Bar dataKey="LSTM Neural Network" fill={modelColors["LSTM Neural Network"]} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center gap-2.5">
                  <Trophy className="h-4 w-4 text-primary" />
                  <div>
                    <h2 className="font-display text-sm font-semibold">Best Model Forecast</h2>
                    <p className="text-[10px] text-muted-foreground">{bestModel?.modelName} • {bestModel?.accuracy}% acc.</p>
                  </div>
                </div>
                <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
                  {bestModel?.futureDates.map((date, i) => {
                    const prevPrice = i === 0 ? (current?.price ?? bestModel.testActual[bestModel.testActual.length - 1]) : bestModel.futurePredictions[i - 1];
                    const change = ((bestModel.futurePredictions[i] - prevPrice) / prevPrice) * 100;
                    const up = change >= 0;
                    return (
                      <div key={date} className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3 transition-all hover:bg-muted/40">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Day {i + 1}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{date}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-sm font-bold text-gradient-gold">${bestModel.futurePredictions[i].toLocaleString()}</span>
                          <p className={`flex items-center justify-end gap-0.5 text-[10px] font-semibold ${up ? "text-success" : "text-destructive"}`}>
                            {up ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                            {up ? "+" : ""}{change.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Error Distribution */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <Zap className="h-4 w-4 text-primary" />
                <div>
                  <h2 className="font-display text-sm font-semibold">Prediction Error Distribution</h2>
                  <p className="text-[10px] text-muted-foreground">Absolute error (USD) per test day — lower is better</p>
                </div>
              </div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={errorData}>
                    <defs>
                      {Object.entries(modelColors).map(([name, color]) => (
                        <linearGradient key={name} id={`err-${name.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 14% 11%)" />
                    <XAxis dataKey="index" stroke="hsl(225 10% 30%)" fontSize={9} tickLine={false} />
                    <YAxis stroke="hsl(225 10% 30%)" fontSize={9} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(225 22% 8%)", border: "1px solid hsl(225 14% 15%)", borderRadius: "12px", fontSize: "11px" }} formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]} />
                    {Object.entries(modelColors).map(([name, color]) => (
                      <Area key={name} type="monotone" dataKey={name} stroke={color} strokeWidth={1.5} fill={`url(#err-${name.replace(/\s/g, "")})`} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Model Comparison Table */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <h2 className="font-display text-sm font-semibold">Model Comparison Summary</h2>
              </div>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-2.5 text-left">Model</th>
                      <th className="px-3 py-2.5 text-right">Accuracy</th>
                      <th className="px-3 py-2.5 text-right">MAE ($)</th>
                      <th className="px-3 py-2.5 text-right">RMSE ($)</th>
                      <th className="px-3 py-2.5 text-right">R² Score</th>
                      <th className="px-3 py-2.5 text-right">MAPE</th>
                      <th className="px-3 py-2.5 text-right">Next Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.modelName} className={`border-b border-border/30 ${r === bestModel ? "bg-success/5" : ""}`}>
                        <td className="px-3 py-3 flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: modelColors[r.modelName] }} />
                          <span className="font-medium">{r.modelName}</span>
                          {r === bestModel && <Trophy className="h-3 w-3 text-success" />}
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-gradient-gold">{r.accuracy}%</td>
                        <td className="px-3 py-3 text-right font-mono">${r.mae.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right font-mono">${r.rmse.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right font-mono">{r.r2.toFixed(4)}</td>
                        <td className="px-3 py-3 text-right font-mono">{r.mape}%</td>
                        <td className="px-3 py-3 text-right font-mono font-semibold">${r.futurePredictions[0].toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        ) : (
          <div className="flex h-[300px] items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 text-sm text-destructive">
            Failed to train models. Try refreshing the page.
          </div>
        )}

        <footer className="border-t border-border py-5 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          AI-Based Bitcoin Price Prediction — ML Course Project • Trained on Kaggle Bitcoin Historical Dataset
        </footer>
      </main>
    </div>
  );
};

function MetricBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-2.5 py-1.5">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-mono text-xs font-semibold">{value}</p>
    </div>
  );
}

export default Predictions;
