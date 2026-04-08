import { Database, Cpu, FlaskConical, LineChart, Settings2, CheckCircle2 } from "lucide-react";

const steps = [
  { icon: Database, title: "Data Collection", desc: "Yahoo Finance BTC-USD historical data" },
  { icon: Settings2, title: "Preprocessing", desc: "Normalization, missing values, feature engineering" },
  { icon: FlaskConical, title: "Train/Test Split", desc: "80/20 split with time-series validation" },
  { icon: Cpu, title: "Model Training", desc: "Linear Reg, Random Forest, LSTM" },
  { icon: LineChart, title: "Prediction", desc: "Next-day & next-week price forecasts" },
  { icon: CheckCircle2, title: "Evaluation", desc: "MAE, RMSE, R² Score comparison" },
];

const MethodologySection = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 text-base font-semibold">Methodology Pipeline</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="group relative flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-center transition-all hover:border-primary/30 hover:bg-primary/5"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <step.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs font-medium leading-tight">{step.title}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{step.desc}</p>
            {i < steps.length - 1 && (
              <div className="absolute -right-2 top-1/2 hidden h-px w-4 bg-border lg:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MethodologySection;
