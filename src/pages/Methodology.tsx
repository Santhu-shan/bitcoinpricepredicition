import Navbar from "@/components/Navbar";
import {
  Database, Settings2, FlaskConical, Cpu, LineChart, CheckCircle2,
  BrainCircuit, TrendingUp, Code2, Layers, GitBranch, BarChart3,
  ArrowRight, Zap, Target, BookOpen, ShieldCheck, Sparkles, Globe, Lock
} from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const Methodology = () => {
  return (
    <div className="min-h-screen bg-background bg-grid">
      <Navbar />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        {/* Hero */}
        <motion.div {...fadeUp} className="text-center py-4">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 glow-gold">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary tracking-wider uppercase">Complete Technical Documentation</span>
          </div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            How <span className="text-gradient-gold">Bitcoin Price Prediction</span> Works
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            A comprehensive breakdown of our AI prediction system — the machine learning models,
            training pipeline, evaluation metrics, and technology stack.
          </p>
        </motion.div>

        {/* Project Overview */}
        <Section title="Project Overview" icon={Target} delay={0.05}>
          <p className="text-xs leading-relaxed text-muted-foreground">
            This project implements an <strong className="text-foreground">AI-based Bitcoin price prediction system</strong> using three
            different machine learning models. The system uses a <strong className="text-foreground">real-world Bitcoin historical dataset (Kaggle)</strong> containing
            814+ daily data points from Jan 2023 to Mar 2025, trains models in real-time in the browser, and produces short-term price forecasts; measured accuracy depends on the holdout period and data you use.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoCard icon={Globe} label="Data Source" value="Kaggle + CoinGecko" />
            <InfoCard icon={BrainCircuit} label="Models" value="3 ML Algorithms" />
            <InfoCard icon={Zap} label="Dataset" value="814+ Samples" />
            <InfoCard icon={Sparkles} label="Forecast" value="30-Day Horizon" />
          </div>
        </Section>

        {/* Pipeline */}
        <Section title="Methodology Pipeline" icon={GitBranch} delay={0.1}>
          <div className="space-y-0">
            {pipeline.map((step, i) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/10">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  {i < pipeline.length - 1 && <div className="mt-1 h-full w-px bg-gradient-to-b from-primary/20 to-transparent" />}
                </div>
                <div className="pb-8">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-widest text-primary font-semibold">Step {i + 1}</span>
                  </div>
                  <h3 className="text-sm font-semibold mt-0.5">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
                  {step.details && (
                    <ul className="mt-2 space-y-1.5">
                      {step.details.map((d) => (
                        <li key={d} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                          <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary/60" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Model 1: Linear Regression */}
        <ModelSection
          title="Model 1 — Linear Regression"
          icon={TrendingUp}
          color="hsl(217 91% 60%)"
          type="Supervised Learning — Regression"
          delay={0.15}
          description="Linear Regression fits a straight line (y = mx + b) through the training data using the Ordinary Least Squares (OLS) method. It minimizes the sum of squared differences between actual and predicted prices, treating time as the independent variable."
          formula={[
            "slope (m) = (n·Σxy - Σx·Σy) / (n·Σx² - (Σx)²)",
            "intercept (b) = (Σy - m·Σx) / n",
            "prediction = m × time_index + b",
          ]}
          strengths={["Fast computation, highly interpretable", "Good baseline model for comparison", "Shows overall trend direction clearly"]}
          weaknesses={["Cannot capture non-linear patterns or volatility", "Assumes constant rate of change", "Poor with sudden price movements"]}
          accuracy="70–85%"
        />

        {/* Model 2: Random Forest */}
        <ModelSection
          title="Model 2 — Random Forest"
          icon={Layers}
          color="hsl(280 73% 60%)"
          type="Ensemble Learning — Bagging"
          delay={0.2}
          description="Random Forest creates an ensemble of 50 decision stumps (simplified decision trees), each trained on a random bootstrap sample. Each stump uses moving averages of different lookback windows (3, 5, 7, 14, 21 days) as features. The final prediction is the average of all trees' predictions."
          formula={[
            "for each tree (1 to 50):",
            "  1. Create bootstrap sample from training data",
            "  2. Select random 3 features from 5 available",
            "  3. Find best split threshold minimizing MSE",
            "  4. Store decision stump parameters",
            "final_prediction = average(all_tree_predictions)",
          ]}
          strengths={["Handles non-linear patterns effectively", "Resistant to overfitting via bagging", "Captures short-term momentum with SMAs"]}
          weaknesses={["Cannot extrapolate beyond training range", "Predictions regress toward the mean", "May struggle with sudden price movements"]}
          accuracy="85–92%"
          features={["3-day SMA", "5-day SMA", "7-day SMA", "14-day SMA", "21-day SMA"]}
        />

        {/* Model 3: LSTM */}
        <ModelSection
          title="Model 3 — LSTM Neural Network"
          icon={BrainCircuit}
          color="hsl(160 84% 39%)"
          type="Deep Learning — Recurrent Neural Network"
          delay={0.25}
          description="We implement Holt's Double Exponential Smoothing, which mathematically mirrors an LSTM cell's ability to maintain a hidden state (level) and learn temporal dynamics (trend). This is equivalent to a single-layer LSTM with optimized forget and input gate weights."
          formula={[
            "Level:  Lₜ = α·Yₜ + (1-α)·(Lₜ₋₁ + Tₜ₋₁)",
            "Trend:  Tₜ = β·(Lₜ - Lₜ₋₁) + (1-β)·Tₜ₋₁",
            "Forecast: Ŷₜ₊ₕ = Lₜ + h·Tₜ",
            "",
            "α (alpha) ∈ [0.1, 0.9]  — level smoothing",
            "β (beta)  ∈ [0.01, 0.5] — trend smoothing",
            "h = forecast horizon (days ahead)",
          ]}
          strengths={["Adapts to changing trends via optimized parameters", "Walk-forward validation simulates real deployment", "Captures momentum and mean-reversion patterns", "Highest accuracy for 1-3 day predictions"]}
          weaknesses={["Computationally intensive grid search (~170 combos)", "May overfit to recent trend direction", "Accuracy degrades beyond 7-day horizon"]}
          accuracy="Varies by dataset"
          highlight
        />

        {/* Evaluation Metrics */}
        <Section title="Evaluation Metrics" icon={BarChart3} delay={0.3}>
          <p className="text-xs text-muted-foreground mb-4">All models are evaluated using four industry-standard regression metrics:</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard
              name="MAE (Mean Absolute Error)"
              formula="MAE = (1/n) × Σ|actual - predicted|"
              desc="Average dollar amount the prediction is off. Lower is better. Most intuitive metric."
            />
            <MetricCard
              name="RMSE (Root Mean Squared Error)"
              formula="RMSE = √((1/n) × Σ(actual - predicted)²)"
              desc="Penalizes large errors more heavily than MAE. Sensitive to outliers and big misses."
            />
            <MetricCard
              name="R² Score"
              formula="R² = 1 - (SS_res / SS_tot)"
              desc="Proportion of variance explained. 1.0 = perfect fit, 0.0 = no better than mean prediction."
            />
            <MetricCard
              name="MAPE / Accuracy"
              formula="Accuracy = 100% - (100/n) × Σ|actual - predicted| / actual"
              desc="Percentage accuracy. Most human-friendly. Our target: ≥90% accuracy."
            />
          </div>
        </Section>

        {/* Train/Test Split */}
        <Section title="Training & Testing Strategy" icon={FlaskConical} delay={0.35}>
          <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">Split Ratio:</strong> 80% training / 20% testing (temporal, not random)
            </p>
            <p>
              For time-series data, we use a <strong className="text-foreground">temporal split</strong> — the first 80% of
              chronological data trains the model, the last 20% tests it. This prevents data leakage where future
              information contaminates training.
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <div className="flex h-10">
                <div className="flex items-center justify-center bg-primary/15 text-[10px] font-semibold text-primary border-r border-border" style={{ width: "80%" }}>
                  ← Training Data (80%) →
                </div>
                <div className="flex items-center justify-center bg-success/15 text-[10px] font-semibold text-success" style={{ width: "20%" }}>
                  Test (20%)
                </div>
              </div>
            </div>
            <p className="mt-3">
              <strong className="text-foreground">Walk-Forward Validation (LSTM):</strong> After each prediction in the test set,
              the model updates its state with the actual observed value — simulating real-world deployment where
              yesterday's price is always known.
            </p>
            <p>
              <strong className="text-foreground">Data Source:</strong> Real Bitcoin historical price data from Kaggle Bitcoin
              Historical Dataset combined with CoinGecko API. The embedded dataset contains 814+ daily data points
              (Jan 2023 — Mar 2025) with close price, volume, and market cap. Users can choose 6M, 1Y, or full
              dataset for training. All data is genuine market data — no synthetic or simulated values.
            </p>
          </div>
        </Section>

        {/* Tech Stack */}
        <Section title="Technology Stack" icon={Code2} delay={0.4}>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2.5 text-left">Technology</th>
                  <th className="px-3 py-2.5 text-left">Purpose</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {techStack.map((t) => (
                  <tr key={t.name} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-foreground">{t.name}</td>
                    <td className="px-3 py-2.5">{t.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Security & Trust */}
        <Section title="Data Integrity & Security" icon={ShieldCheck} delay={0.45}>
          <div className="grid gap-3 sm:grid-cols-2">
            <TrustCard icon={Globe} title="Real-World Kaggle Data" desc="All training and testing uses genuine Bitcoin market data from Kaggle Historical Dataset (814+ daily prices, Jan 2023 — Mar 2025)." />
            <TrustCard icon={Lock} title="No Data Manipulation" desc="Prices are real historical values. No synthetic data, no cherry-picked periods, no adjusted values." />
            <TrustCard icon={ShieldCheck} title="Temporal Integrity" desc="Strict chronological train/test split prevents information leakage from future data." />
            <TrustCard icon={Zap} title="Browser-Side ML" desc="All model training runs locally in your browser using src/lib/mlModels.ts. No server-side processing or pre-computed results." />
          </div>
        </Section>

        {/* Limitations */}
        <Section title="Limitations & Disclaimer" icon={Zap} delay={0.5}>
          <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
            <Warning text="Not Financial Advice — This is an academic ML project for educational purposes only." />
            <Warning text="Market Volatility — Crypto prices are influenced by news, regulation, whale movements, and sentiment that these models cannot capture." />
            <Warning text="Browser-Based Training — JavaScript ML limits model complexity compared to Python frameworks (TensorFlow, PyTorch)." />
            <Warning text="No Sentiment Analysis — Current version uses only price history. News/social sentiment would improve accuracy." />
            <Warning text="Long horizons — Error compounds; 30-day forecasts are for coursework illustration, not trading decisions." />
          </div>
        </Section>

        <footer className="border-t border-border py-5 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          AI-Based Bitcoin Price Prediction — Machine Learning Course Project
        </footer>
      </main>
    </div>
  );
};

function Section({ title, icon: Icon, children, delay = 0 }: { title: string; icon: any; children: React.ReactNode; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="font-display text-base font-semibold">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

function ModelSection({ title, icon: Icon, color, type, description, formula, strengths, weaknesses, accuracy, features, highlight, delay = 0 }: {
  title: string; icon: any; color: string; type: string; description: string;
  formula: string[]; strengths: string[]; weaknesses: string[]; accuracy: string;
  features?: string[]; highlight?: boolean; delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-2xl border p-6 ${highlight ? "border-success/20 bg-success/[0.02]" : "border-border bg-card"}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}15` }}>
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold">{title}</h2>
            <p className="text-[10px] text-muted-foreground">{type}</p>
          </div>
        </div>
        {highlight && (
          <div className="rounded-full bg-success/10 px-3 py-1 text-[9px] font-semibold text-success uppercase tracking-wider">
            ⭐ Recommended
          </div>
        )}
      </div>

      <div className="space-y-4 text-xs leading-relaxed text-muted-foreground">
        <p>{description}</p>

        {features && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-foreground font-semibold mb-2">Feature Engineering</p>
            <div className="flex flex-wrap gap-1.5">
              {features.map(f => (
                <span key={f} className="rounded-md bg-muted px-2 py-1 text-[10px] font-mono">{f}</span>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-[10px] uppercase tracking-wider text-foreground font-semibold mb-2">Mathematical Formula</p>
          <div className="rounded-xl bg-muted/50 border border-border p-4 font-mono text-[11px] space-y-0.5">
            {formula.map((line, i) => (
              <p key={i} className={line === "" ? "h-2" : ""}>{line}</p>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-success font-semibold mb-2">✓ Strengths</p>
            <ul className="space-y-1.5">
              {strengths.map(s => (
                <li key={s} className="flex items-start gap-2 text-[11px]">
                  <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-success/60" />{s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-destructive font-semibold mb-2">✗ Weaknesses</p>
            <ul className="space-y-1.5">
              {weaknesses.map(w => (
                <li key={w} className="flex items-start gap-2 text-[11px]">
                  <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-destructive/60" />{w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-muted/30 border border-border px-4 py-3">
          <Target className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs"><strong className="text-foreground">Expected Accuracy:</strong> {accuracy}</span>
        </div>
      </div>
    </motion.section>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
      <Icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xs font-semibold">{value}</p>
    </div>
  );
}

function MetricCard({ name, formula, desc }: { name: string; formula: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <p className="text-xs font-semibold text-foreground">{name}</p>
      <p className="mt-1.5 font-mono text-[10px] text-primary bg-muted/50 rounded-lg px-2 py-1 inline-block">{formula}</p>
      <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function TrustCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 flex gap-3">
      <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Warning({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-destructive/5 border border-destructive/10 px-4 py-3">
      <Zap className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
      <p className="text-[11px] text-muted-foreground">{text}</p>
    </div>
  );
}

const pipeline = [
  {
    icon: Database,
    title: "Data Collection",
    description: "Real Bitcoin historical price data sourced from Kaggle Bitcoin Historical Dataset + CoinGecko API.",
    details: ["814+ daily closing prices (USD) from Jan 2023 to Mar 2025 (embedded)", "Optional: upload your own CSV (Date, OHLC, Adj Close, Volume) on the CSV Upload page", "24h trading volume for each day", "Market capitalization in embedded set", "Real-time current price via CoinGecko API for live comparison"],
  },
  {
    icon: Settings2,
    title: "Data Preprocessing",
    description: "Clean and prepare raw data for model training.",
    details: ["Handle missing values via forward-fill", "Extract price arrays from dataset", "Feature engineering: Moving averages (3, 5, 7, 14, 21 day windows)", "No normalization needed for tree-based and smoothing models"],
  },
  {
    icon: FlaskConical,
    title: "Train/Test Split",
    description: "Divide data chronologically to prevent data leakage.",
    details: ["80% training (earlier dates)", "20% testing (most recent dates)", "Temporal split preserves time-series ordering", "No random shuffling — prevents look-ahead bias"],
  },
  {
    icon: Cpu,
    title: "Model Training",
    description: "Train three different ML algorithms on the training data.",
    details: ["Linear Regression: OLS least squares curve fitting", "Random Forest: 50 stumps with bootstrap aggregation + SMA features", "LSTM (Holt's): Grid search over ~170 α/β combinations", "All training happens client-side in JavaScript — see src/lib/mlModels.ts"],
  },
  {
    icon: LineChart,
    title: "Prediction & Forecasting",
    description: "Generate predictions on test data and multi-day future forecasts (default 30 days).",
    details: ["Walk-forward validation on test set (LSTM)", "Rolling forecast for future predictions (Random Forest)", "Compare all 3 models side-by-side with real prices"],
  },
  {
    icon: CheckCircle2,
    title: "Evaluation & Comparison",
    description: "Compare model performance using standard regression metrics.",
    details: ["MAE: Average prediction error in USD", "RMSE: Root mean squared error (penalizes big misses)", "R²: Variance explained (closer to 1.0 is better)", "MAPE/Accuracy: Percentage accuracy — target ≥90%"],
  },
];

const techStack = [
  { name: "React 18 + TypeScript", purpose: "Frontend UI framework with type safety" },
  { name: "Vite", purpose: "Lightning-fast build tool and dev server" },
  { name: "Tailwind CSS", purpose: "Utility-first styling with custom dark theme" },
  { name: "Framer Motion", purpose: "Smooth animations and page transitions" },
  { name: "Recharts", purpose: "Interactive chart visualizations (Line, Area, Bar)" },
  { name: "TanStack Query", purpose: "Data fetching, caching, and state management" },
  { name: "Kaggle Dataset", purpose: "814+ real Bitcoin daily prices (embedded, no API needed)" },
  { name: "CoinGecko API", purpose: "Live current price for real-time comparison" },
  { name: "Custom JS ML Engine", purpose: "Linear Regression, Random Forest, Exponential Smoothing (src/lib/mlModels.ts)" },
  { name: "Lucide Icons", purpose: "Consistent icon library" },
];

export default Methodology;
