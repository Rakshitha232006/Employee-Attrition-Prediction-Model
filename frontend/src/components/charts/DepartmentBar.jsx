import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function DepartmentBar({ data, loading }) {
  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3">
        <div className="h-36 w-full max-w-md skeleton rounded-lg" />
        <span className="text-[11px] text-slate-600">Loading breakdown…</span>
      </div>
    );
  }
  const chartData = data?.departments?.length
    ? data.departments
    : [{ department: "—", avg_risk_pct: 0, count: 0 }];
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.12)" />
        <XAxis
          dataKey="department"
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
        />
        <Bar
          dataKey="avg_risk_pct"
          name="Avg risk %"
          fill="url(#barGrad)"
          radius={[6, 6, 0, 0]}
        />
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
