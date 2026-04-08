import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { bitcoinDataset } from "@/data/bitcoinDataset";
import { BarChart3 } from "lucide-react";

const VolumeChart = () => {
  const data = bitcoinDataset.slice(-30).map((d) => ({
    date: d.date.slice(5),
    volume: d.volume / 1e9,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold">Trading Volume (30d)</h2>
      </div>
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="date" stroke="hsl(220 10% 50%)" fontSize={10} tickLine={false} interval={4} />
            <YAxis stroke="hsl(220 10% 50%)" fontSize={10} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}B`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220 18% 7%)",
                border: "1px solid hsl(220 14% 14%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`$${value.toFixed(1)}B`, "Volume"]}
            />
            <Bar dataKey="volume" fill="hsl(43 96% 56% / 0.4)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VolumeChart;
