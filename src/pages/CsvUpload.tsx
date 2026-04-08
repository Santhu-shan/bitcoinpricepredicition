import { useCallback, useState } from "react";
import Navbar from "@/components/Navbar";
import { runCsvPipeline, seedFromSeries, type CsvPipelineResult } from "@/lib/csvPipeline";
import { runAllModels, type TrainTestResult } from "@/lib/mlModels";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Database, TrendingUp, TrendingDown, Minus,
  BrainCircuit, LineChart, BarChart3, Table2, Sparkles,
} from "lucide-react";
import {
  LineChart as RLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from "recharts";

const modelColors: Record<string, string> = {
  "Linear Regression": "hsl(217 91% 60%)",
  "Random Forest": "hsl(280 73% 60%)",
  "LSTM Neural Network": "hsl(160 84% 39%)",
};

const CsvUpload = () => {
  const [pipeline, setPipeline] = useState<CsvPipelineResult | null>(null);
  const [results, setResults] = useState<TrainTestResult[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const processText = useCallback((text: string, name: string) => {
    setBusy(true);
    setError(null);
    setFileName(name);
    try {
      const p = runCsvPipeline(text);
      setPipeline(p);
      if (p.error || p.closes.length < 30) {
        setResults(null);
        if (p.error) setError(p.error);
        setBusy(false);
        return;
      }
      const lastDate = p.dates[p.dates.length - 1];
      const seed = seedFromSeries(p.closes);
      const r = runAllModels(p.closes, { lastDate, futureDays: 30, seed });
      setResults(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to process file");
      setPipeline(null);
      setResults(null);
    }
    setBusy(false);
  }, []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const lower = f.name.toLowerCase();
    const escapeCell = (value: unknown) => {
      const s = value === null || value === undefined ? "" : String(value);
      // Quote cells that contain commas/quotes/newlines.
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (lower.endsWith(".csv")) {
          const text = typeof reader.result === "string" ? reader.result : "";
          processText(text, f.name);
          return;
        }

        if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
          const result = reader.result;
          if (!(result instanceof ArrayBuffer)) {
            throw new Error("Failed to read Excel file.");
          }

          const workbook = XLSX.read(result, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const aoa = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true, defval: "" }) as unknown[][];

          if (!aoa.length) throw new Error("Excel file has no data.");

          const headerRow = (aoa[0] ?? []).map((c) => escapeCell(c)).join(",");
          const dataRows = aoa
            .slice(1)
            .filter((row) => row.some((c) => String(c ?? "").trim().length > 0))
            .map((row) => row.map((c) => escapeCell(c)).join(","));

          const csvText = [headerRow, ...dataRows].join("\n");
          processText(csvText, f.name);
          return;
        }

        setError("Unsupported file type. Please upload `.csv`, `.xlsx`, or `.xls`.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse Excel file.");
        setPipeline(null);
        setResults(null);
      }
    };

    if (lower.endsWith(".csv")) reader.readAsText(f);
    else reader.readAsArrayBuffer(f);
  };

  const trendIcon = (d: string) => {
    if (d === "up") return <TrendingUp className="h-5 w-5 text-success" />;
    if (d === "down") return <TrendingDown className="h-5 w-5 text-destructive" />;
    return <Minus className="h-5 w-5 text-muted-foreground" />;
  };

  const best = results?.reduce((a, b) => (a.accuracy >= b.accuracy ? a : b), results[0]);

  const testChart =
    results && pipeline && !pipeline.error
      ? results[0].testActual.map((actual, i) => ({
          date: pipeline.dates[pipeline.splitIndex + i]?.slice(5) ?? `T${i}`,
          fullDate: pipeline.dates[pipeline.splitIndex + i] ?? "",
          actual,
          "Linear Regression": results[0].testPredicted[i],
          "Random Forest": results[1].testPredicted[i],
          "LSTM Neural Network": results[2].testPredicted[i],
        }))
      : [];

  const futureChart =
    results?.[0].futureDates.map((date, i) => ({
      date: date.slice(5),
      fullDate: date,
      "Linear Regression": results[0].futurePredictions[i],
      "Random Forest": results[1].futurePredictions[i],
      "LSTM Neural Network": results[2].futurePredictions[i],
    })) ?? [];

  return (
    <div className="min-h-screen bg-background bg-grid">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-primary/20 bg-primary/5 p-5 glow-gold">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold">CSV data mining &amp; prediction</h1>
                <p className="mt-1 text-xs text-muted-foreground max-w-2xl leading-relaxed">
                  Upload a CSV with columns: Date, Open, High, Low, Close, Adj Close, Volume. The pipeline runs preprocessing,
                  an 80/20 temporal split, trains Linear Regression, Random Forest, and LSTM-style Holt smoothing, evaluates
                  accuracy, estimates trend, and forecasts the next 30 days.
                </p>
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity">
              <Upload className="h-4 w-4" />
              Choose CSV/XLSX
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={onFile}
                disabled={busy}
              />
            </label>
          </div>
          {fileName && (
            <p className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Loaded: {fileName}
            </p>
          )}
        </motion.div>

        {busy && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Processing…
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {pipeline && (
          <>
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <h2 className="font-display text-sm font-semibold">Preprocessing log</h2>
              </div>
              <ol className="list-decimal space-y-2 pl-5 text-xs text-muted-foreground">
                {pipeline.preprocessingLog.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ol>
            </motion.section>

            {pipeline.rows.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Rows (clean)</p>
                  <p className="mt-1 font-mono text-2xl font-bold">{pipeline.rows.length}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Train / Test</p>
                  <p className="mt-1 font-mono text-xl font-bold">
                    {pipeline.trainRows} / {pipeline.testRows}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
                  {trendIcon(pipeline.trend.direction)}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Trend (OLS)</p>
                    <p className="text-sm font-semibold capitalize">{pipeline.trend.direction}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {pipeline.trend.slopePerDay} USD/day · {pipeline.trend.cumulativeReturnPct}% total return
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Date range</p>
                  <p className="mt-1 font-mono text-xs">
                    {pipeline.dates[0]} → {pipeline.dates[pipeline.dates.length - 1]}
                  </p>
                </div>
              </motion.section>
            )}
          </>
        )}

        {results && pipeline && !pipeline.error && (
          <>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3 sm:grid-cols-3">
              {results.map((r) => (
                <div
                  key={r.modelName}
                  className={`rounded-2xl border p-5 ${r === best ? "border-success/30 bg-success/5" : "border-border bg-card"}`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">{r.modelName}</span>
                    {r === best && <span className="ml-auto text-[9px] font-semibold text-success">Best accuracy</span>}
                  </div>
                  <p className="font-mono text-3xl font-bold text-gradient-gold">{r.accuracy}%</p>
                  <p className="text-[10px] text-muted-foreground mb-3">accuracy (100 − MAPE)</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">MAE</span>
                      <p className="font-mono">${r.mae.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">RMSE</span>
                      <p className="font-mono">${r.rmse.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">R²</span>
                      <p className="font-mono">{r.r2.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">MAPE</span>
                      <p className="font-mono">{r.mape}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <LineChart className="h-4 w-4 text-primary" />
                <h2 className="font-display text-sm font-semibold">Test set: actual vs predicted</h2>
              </div>
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RLineChart data={testChart} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 14% 11%)" />
                    <XAxis dataKey="date" stroke="hsl(225 10% 30%)" fontSize={10} tickLine={false} interval={Math.max(1, Math.floor(testChart.length / 10))} />
                    <YAxis stroke="hsl(225 10% 30%)" fontSize={10} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(225 22% 8%)", border: "1px solid hsl(225 14% 15%)", borderRadius: "12px", fontSize: "11px" }}
                      labelFormatter={(_, p) => p?.[0]?.payload?.fullDate ?? ""}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Line type="monotone" dataKey="actual" name="Actual" stroke="hsl(43 100% 50%)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Linear Regression" stroke={modelColors["Linear Regression"]} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="Random Forest" stroke={modelColors["Random Forest"]} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="LSTM Neural Network" stroke={modelColors["LSTM Neural Network"]} strokeWidth={2} dot={false} />
                  </RLineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-display text-sm font-semibold">30-day price forecast (all models)</h2>
              </div>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={futureChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 14% 11%)" />
                    <XAxis dataKey="date" stroke="hsl(225 10% 30%)" fontSize={9} tickLine={false} interval={2} />
                    <YAxis stroke="hsl(225 10% 30%)" fontSize={10} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(225 22% 8%)", border: "1px solid hsl(225 14% 15%)", borderRadius: "12px", fontSize: "11px" }}
                      labelFormatter={(_, p) => p?.[0]?.payload?.fullDate ?? ""}
                    />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                    <Bar dataKey="Linear Regression" fill={modelColors["Linear Regression"]} radius={[4, 4, 0, 0]} opacity={0.75} />
                    <Bar dataKey="Random Forest" fill={modelColors["Random Forest"]} radius={[4, 4, 0, 0]} opacity={0.75} />
                    <Bar dataKey="LSTM Neural Network" fill={modelColors["LSTM Neural Network"]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Table2 className="h-4 w-4 text-primary" />
                <h2 className="font-display text-sm font-semibold">30-day forecast table (best model: {best?.modelName})</h2>
              </div>
              <div className="max-h-[400px] overflow-auto scrollbar-thin">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border text-[10px] uppercase text-muted-foreground">
                      <th className="px-2 py-2 text-left">Date</th>
                      <th className="px-2 py-2 text-right">Linear Reg.</th>
                      <th className="px-2 py-2 text-right">Random Forest</th>
                      <th className="px-2 py-2 text-right">LSTM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {best?.futureDates.map((d, i) => (
                      <tr key={d} className="border-b border-border/40">
                        <td className="px-2 py-2 font-mono text-muted-foreground">{d}</td>
                        <td className="px-2 py-2 text-right font-mono">${results[0].futurePredictions[i].toLocaleString()}</td>
                        <td className="px-2 py-2 text-right font-mono">${results[1].futurePredictions[i].toLocaleString()}</td>
                        <td className="px-2 py-2 text-right font-mono font-semibold">${results[2].futurePredictions[i].toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h2 className="font-display text-sm font-semibold">Model comparison (test set)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase text-muted-foreground">
                      <th className="px-3 py-2 text-left">Model</th>
                      <th className="px-3 py-2 text-right">Accuracy</th>
                      <th className="px-3 py-2 text-right">MAE</th>
                      <th className="px-3 py-2 text-right">RMSE</th>
                      <th className="px-3 py-2 text-right">R²</th>
                      <th className="px-3 py-2 text-right">MAPE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.modelName} className={`border-b border-border/30 ${r === best ? "bg-success/5" : ""}`}>
                        <td className="px-3 py-2.5 font-medium">{r.modelName}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold">{r.accuracy}%</td>
                        <td className="px-3 py-2.5 text-right font-mono">${r.mae.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right font-mono">${r.rmse.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{r.r2.toFixed(4)}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{r.mape}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}

        <footer className="border-t border-border py-5 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          CSV/XLSX pipeline: preprocessing → 80/20 split → three models → metrics → 30-day forecast
        </footer>
      </main>
    </div>
  );
};

export default CsvUpload;
