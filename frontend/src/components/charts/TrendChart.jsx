import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function TrendChart({ data, loading }) {
  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3">
        <div className="h-32 w-full max-w-md skeleton rounded-lg" />
        <span className="text-[11px] text-slate-600">Loading series…</span>
      </div>
    );
  }
  const chartData =
    data?.points?.length > 0
      ? data.points
      : [{ month: "—", avg_risk_pct: 0, count: 0 }];
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.12)" />
        <XAxis
          dataKey="month"
          stroke="#065f46"
          tick={{ fill: "#34d399", fontSize: 10, fontFamily: "JetBrains Mono" }}
        />
        <YAxis
          stroke="#065f46"
          tick={{ fill: "#34d399", fontSize: 10, fontFamily: "JetBrains Mono" }}
          unit="%"
        />
        <Tooltip
          contentStyle={{
            background: "rgba(2,6,4,0.95)",
            border: "1px solid rgba(16,185,129,0.25)",
            borderRadius: 8,
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 11,
          }}
          labelStyle={{ color: "#6ee7b7" }}
        />
        <Line
          type="monotone"
          dataKey="avg_risk_pct"
          name="Avg risk %"
          stroke="#34d399"
          strokeWidth={2}
          dot={{ r: 3, fill: "#6ee7b7" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
