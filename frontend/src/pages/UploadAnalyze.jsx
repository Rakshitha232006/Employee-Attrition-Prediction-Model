import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Legend,
} from "recharts";
import GlassCard from "../components/GlassCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { uploadAnalyzeCsv } from "../services/api.js";

const COLORS = ["#34d399", "#2dd4bf", "#22d3ee", "#a78bfa", "#fb7185", "#fbbf24"];

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-sm font-semibold text-white border-b border-emerald-500/15 pb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function UploadAnalyze() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  const onFile = useCallback(async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLoading(true);
    setErr("");
    setData(null);
    try {
      const res = await uploadAnalyzeCsv(f);
      setData(res);
    } catch (er) {
      setErr(
        er?.response?.data?.detail ||
          er?.message ||
          "Upload failed. Is the API running?"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const schema = data?.schema;
  const overview = data?.overview;
  const summary = data?.summary;
  const numericBins = data?.numeric_bins || {};
  const categorical = data?.categorical || {};
  const insights = data?.insights || [];

  return (
    <div className="max-w-[1600px] mx-auto space-y-10">
      <PageHeader
        eyebrow="Dataset mode"
        title="Upload"
        titleAccent="& analyze"
        description="Drop an IBM-style HR CSV. We detect columns, target Attrition, and run groupby analytics, correlations, and insights — no synthetic data."
      />

      <GlassCard className="p-8 border border-dashed border-emerald-500/25 hover:border-emerald-500/40 transition-colors">
        <label className="flex flex-col items-center justify-center cursor-pointer gap-4 py-8">
          <div className="h-14 w-14 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white">Choose CSV file</p>
            <p className="text-[11px] text-emerald-700 font-mono mt-1">
              Max 12 MB · must include Attrition (Yes/No)
            </p>
          </div>
          <input type="file" accept=".csv" className="hidden" onChange={onFile} disabled={loading} />
        </label>
        {loading && (
          <p className="text-center text-sm text-emerald-600 font-mono">Analyzing…</p>
        )}
        {err && (
          <p className="text-center text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 mt-4">
            {typeof err === "string" ? err : JSON.stringify(err)}
          </p>
        )}
      </GlassCard>

      {data?.error && (
        <GlassCard className="p-6 border-amber-500/20">
          <p className="text-amber-200 text-sm">{data.error}</p>
          {schema && (
            <pre className="mt-4 text-[10px] text-emerald-700 font-mono overflow-x-auto">
              {JSON.stringify(schema, null, 2)}
            </pre>
          )}
        </GlassCard>
      )}

      {data && !data.error && summary && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            ["Rows", summary.total_employees],
            ["Attrition %", `${summary.attrition_rate_pct}%`],
            ["Avg income", summary.avg_monthly_income ?? "—"],
            ["Avg satisfaction", summary.avg_job_satisfaction ?? "—"],
          ].map(([k, v]) => (
            <GlassCard key={k} className="p-5">
              <p className="text-[10px] font-mono uppercase text-emerald-600">{k}</p>
              <p className="text-xl font-mono text-emerald-100 mt-1">{v}</p>
            </GlassCard>
          ))}
        </motion.div>
      )}

      {schema && overview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <Section title="Schema detection">
              <p className="text-[11px] text-emerald-800 font-mono mb-2">
                Target: <span className="text-emerald-400">{schema.target_column || "—"}</span>
              </p>
              <p className="text-xs text-slate-400 mb-2">Numeric ({schema.numeric_columns?.length ?? 0})</p>
              <div className="flex flex-wrap gap-1.5">
                {(schema.numeric_columns || []).slice(0, 20).map((c) => (
                  <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-400 font-mono">
                    {c}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-4 mb-2">Categorical ({schema.categorical_columns?.length ?? 0})</p>
              <div className="flex flex-wrap gap-1.5">
                {(schema.categorical_columns || []).slice(0, 16).map((c) => (
                  <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-500 font-mono">
                    {c}
                  </span>
                ))}
              </div>
            </Section>
          </GlassCard>
          <GlassCard className="p-6">
            <Section title="Missing values (top)">
              <ul className="space-y-2 max-h-64 overflow-y-auto text-[11px] font-mono">
                {Object.entries(overview.missing_per_column || {})
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 24)
                  .map(([col, n]) => (
                    <li key={col} className="flex justify-between text-slate-400">
                      <span className="truncate mr-2">{col}</span>
                      <span className="text-amber-400/90">{n}</span>
                    </li>
                  ))}
              </ul>
            </Section>
          </GlassCard>
        </div>
      )}

      {insights.length > 0 && (
        <GlassCard className="p-6">
          <Section title="Auto insights">
            <ul className="list-disc list-inside space-y-2 text-sm text-emerald-200/95">
              {insights.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </Section>
        </GlassCard>
      )}

      {Object.keys(numericBins).length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {Object.entries(numericBins).map(([key, series]) => {
            const chartData = (series || []).map((r) => ({
              name: String(r.label).slice(0, 24),
              attrition: r.attrition_rate_pct,
            }));
            const useLine = ["JobSatisfaction", "WorkLifeBalance", "EnvironmentSatisfaction"].includes(key);
            return (
              <GlassCard key={key} className="p-5">
                <p className="text-[10px] font-mono uppercase text-emerald-600 mb-4">{key}</p>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {useLine ? (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#064e3b33" />
                        <XAxis dataKey="name" tick={{ fill: "#6ee7b799", fontSize: 9 }} />
                        <YAxis tick={{ fill: "#6ee7b799", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#022c22ee", border: "1px solid #065f46" }} />
                        <Line type="monotone" dataKey="attrition" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    ) : (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#064e3b33" />
                        <XAxis dataKey="name" tick={{ fill: "#6ee7b799", fontSize: 9 }} angle={-20} textAnchor="end" height={56} />
                        <YAxis tick={{ fill: "#6ee7b799", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#022c22ee", border: "1px solid #065f46" }} />
                        <Bar dataKey="attrition" fill="#34d399" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {Object.keys(categorical).length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {Object.entries(categorical).map(([name, rows]) => {
            const barData = (rows || []).map((r) => ({
              name: String(r.label).slice(0, 18),
              attrition: r.attrition_rate_pct,
            }));
            const pieData = (rows || []).slice(0, 7).map((r, i) => ({
              name: String(r.label).slice(0, 14),
              value: r.count,
              fill: COLORS[i % COLORS.length],
            }));
            return (
              <GlassCard key={name} className="p-5">
                <p className="text-[10px] font-mono uppercase text-emerald-600 mb-4">{name}</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} layout="vertical" margin={{ left: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#064e3b33" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "#6ee7b799", fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" width={90} tick={{ fill: "#6ee7b799", fontSize: 9 }} />
                        <Tooltip contentStyle={{ background: "#022c22ee", border: "1px solid #065f46" }} />
                        <Bar dataKey="attrition" fill="#2dd4bf" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={pieData[i].fill} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#022c22ee", border: "1px solid #065f46" }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {data?.filename && !data?.error && (
        <p className="text-[10px] font-mono text-emerald-800 text-center">
          File: {data.filename}
        </p>
      )}
    </div>
  );
}
