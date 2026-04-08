import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { bitcoinDataset } from "@/data/bitcoinDataset";
import { runAllModels } from "@/lib/mlModels";
import { seedFromSeries } from "@/lib/csvPipeline";

const chartWindow = bitcoinDataset.slice(-180);
const chartPrices = chartWindow.map((d) => d.price);
const chartResults = runAllModels(chartPrices, {
  lastDate: chartWindow[chartWindow.length - 1]?.date,
  seed: seedFromSeries(chartPrices),
  futureDays: 30,
});
const splitIdx = Math.floor(chartWindow.length * 0.8);
const chartData = chartResults[0].testActual.map((actual, i) => ({
  date: chartWindow[splitIdx + i]?.date.slice(5) ?? "",
  actual,
  linearReg: chartResults[0].testPredicted[i],
  randomForest: chartResults[1].testPredicted[i],
  lstm: chartResults[2].testPredicted[i],
}));

const PriceChart = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Actual vs predicted (test window)</h2>
          <p className="text-xs text-muted-foreground">Last 180 days — models evaluated on the final 20% of this window</p>
        </div>
      </div>
      <div className="h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
            <XAxis
              dataKey="date"
              stroke="hsl(220 10% 50%)"
              fontSize={11}
              tickLine={false}
              interval={Math.max(1, Math.floor(chartData.length / 8))}
            />
            <YAxis
              stroke="hsl(220 10% 50%)"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              domain={["dataMin - 2000", "dataMax + 2000"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220 18% 7%)",
                border: "1px solid hsl(220 14% 14%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(40 20% 92%)" }}
              formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
            />
            <Line type="monotone" dataKey="actual" name="Actual Price" stroke="hsl(43 96% 56%)" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="linearReg" name="Linear Regression" stroke="hsl(210 100% 56%)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" opacity={0.7} />
            <Line type="monotone" dataKey="randomForest" name="Random Forest" stroke="hsl(270 70% 60%)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" opacity={0.7} />
            <Line type="monotone" dataKey="lstm" name="LSTM" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart;
