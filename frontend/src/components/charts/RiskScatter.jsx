import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

function riskColor(r) {
  if (r < 30) return "#22c55e";
  if (r < 70) return "#eab308";
  return "#ef4444";
}

export default function RiskScatter({ data, loading }) {
  if (loading) {
    return (
      <div className="h-80 flex flex-col items-center justify-center gap-3">
        <div className="h-56 w-full max-w-lg skeleton rounded-lg" />
        <span className="text-[11px] text-slate-600">Plotting points…</span>
      </div>
    );
  }
  const pts = data?.points?.length
    ? data.points.map((p) => ({
        ...p,
        z: p.risk,
      }))
    : [{ satisfaction: 3, work_life_balance: 3, risk: 40, name: "—" }];
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.1)" />
        <XAxis
          type="number"
          dataKey="satisfaction"
          name="Satisfaction"
          domain={[1, 5]}
          stroke="#065f46"
          tick={{ fill: "#34d399", fontSize: 10, fontFamily: "JetBrains Mono" }}
          label={{
            value: "Job satisfaction (1–5)",
            position: "bottom",
            offset: -4,
            fill: "#059669",
            fontSize: 10,
          }}
        />
        <YAxis
          type="number"
          dataKey="work_life_balance"
          name="WLB"
          domain={[1, 5]}
          stroke="#065f46"
          tick={{ fill: "#34d399", fontSize: 10, fontFamily: "JetBrains Mono" }}
          label={{
            value: "Work-life balance",
            angle: -90,
            position: "insideLeft",
            fill: "#059669",
            fontSize: 10,
          }}
        />
        <ZAxis type="number" dataKey="risk" range={[40, 400]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          contentStyle={{
            background: "rgba(2,6,4,0.95)",
            border: "1px solid rgba(16,185,129,0.25)",
            borderRadius: 8,
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 11,
          }}
          formatter={(v, name) => {
            if (name === "risk") return [`${v}%`, "Attrition risk"];
            return [v, name];
          }}
        />
        <Scatter name="Employees" data={pts} fill="#8884d8">
          {pts.map((entry, i) => (
            <Cell key={i} fill={riskColor(entry.risk)} fillOpacity={0.85} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
