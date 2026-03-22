import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axios from "axios";
import { motion } from "framer-motion";
import GlassCard from "../components/GlassCard.jsx";
import KpiCard from "../components/KpiCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { fetchAnalyticsAll, fetchAnalyticsShap } from "../services/api.js";

const CHART_COLORS = [
  "#34d399",
  "#2dd4bf",
  "#22d3ee",
  "#a78bfa",
  "#fb7185",
  "#fbbf24",
  "#94a3b8",
];

function getApiErrorMessage(err, fallback) {
  if (!axios.isAxiosError(err)) {
    return err?.message || fallback;
  }

  const detail = err.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first === "string" && first.trim()) {
      return first;
    }
    if (first?.msg) {
      return first.msg;
    }
  }

  if (err.response?.status >= 500) {
    return "Server error while generating analytics. Please retry in a few seconds.";
  }
  return err.message || fallback;
}

function corrColor(v) {
  const t = Math.max(-1, Math.min(1, v));
  if (t >= 0) {
    const a = t;
    return `rgb(${16 + Math.round(40 * (1 - a))}, ${185 - Math.round(60 * (1 - a))}, ${129 + Math.round(30 * (1 - a))})`;
  }
  const a = -t;
  return `rgb(${244 - Math.round(40 * (1 - a))}, ${63 + Math.round(40 * (1 - a))}, ${94 + Math.round(20 * (1 - a))})`;
}

function pickCorrHeatmap({ labels, matrix }, maxDim = 16) {
  if (!labels?.length || !matrix?.length) return { labels: [], matrix: [] };
  const yi = labels.findIndex((l) => l === "_y");
  if (yi < 0) {
    const n = Math.min(maxDim, labels.length);
    return {
      labels: labels.slice(0, n),
      matrix: matrix.slice(0, n).map((row) => row.slice(0, n)),
    };
  }
  const scored = labels
    .map((lab, i) => ({
      lab,
      i,
      r: i === yi ? 2 : Math.abs(matrix[i][yi] ?? 0),
    }))
    .filter((x) => x.lab !== "_y")
    .sort((a, b) => b.r - a.r)
    .slice(0, maxDim - 1)
    .map((x) => x.i);
  const idx = [...scored, yi].sort((a, b) => a - b);
  return {
    labels: idx.map((i) => labels[i]),
    matrix: idx.map((i) => idx.map((j) => matrix[i][j])),
  };
}

function linearTrendLine(pts) {
  const p = (pts || []).filter((q) => q.x != null && q.y != null && Number.isFinite(q.x) && Number.isFinite(q.y));
  const n = p.length;
  if (n < 3) return [];
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (const q of p) {
    sx += q.x;
    sy += q.y;
    sxx += q.x * q.x;
    sxy += q.x * q.y;
  }
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-12) return [];
  const b = (n * sxy - sx * sy) / denom;
  const a = (sy - b * sx) / n;
  const xs = p.map((q) => q.x);
  const xmin = Math.min(...xs);
  const xmax = Math.max(...xs);
  return [
    { x: xmin, y: a + b * xmin },
    { x: xmax, y: a + b * xmax },
  ];
}

function crossToStacked(rows, topDim1 = 10) {
  if (!rows?.length) return { data: [], keys: [], labels: [] };
  const by1 = {};
  rows.forEach((r) => {
    const k = String(r.dim1);
    by1[k] = (by1[k] || 0) + (r.count || 0);
  });
  const top1 = Object.entries(by1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topDim1)
    .map(([k]) => k);
  const dim2s = [...new Set(rows.map((r) => String(r.dim2)))].slice(0, 8);
  const data = top1.map((d1) => {
    const o = { name: d1.length > 22 ? `${d1.slice(0, 20)}…` : d1 };
    dim2s.forEach((d2) => {
      const found = rows.find((r) => String(r.dim1) === d1 && String(r.dim2) === d2);
      o[`v_${d2}`] = found ? found.count : 0;
    });
    return o;
  });
  const keys = dim2s.map((d2) => `v_${d2}`);
  return { data, keys, labels: dim2s };
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-4 pb-3 border-b border-emerald-500/15">
      <h2 className="font-display text-sm font-semibold text-white tracking-wide">{title}</h2>
      {subtitle && <p className="text-[11px] text-emerald-800/90 mt-1 font-mono">{subtitle}</p>}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [shapData, setShapData] = useState(null);
  const [shapLoading, setShapLoading] = useState(false);
  const [shapErr, setShapErr] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const d = await fetchAnalyticsAll();
        if (!cancel) setData(d);
      } catch (e) {
        if (!cancel) {
          let msg = "Failed to load analytics.";
          if (axios.isAxiosError(e)) {
            if (e.code === "ERR_NETWORK" || e.code === "ECONNABORTED" || !e.response) {
              msg =
                "Cannot reach the API. Start the backend on the same port Vite proxies to (see vite.config.js, often 8765).";
            } else {
              msg = getApiErrorMessage(e, msg);
            }
          } else {
            msg = e?.message || msg;
          }
          setErr(msg);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!data || err) return;
    let cancel = false;
    (async () => {
      setShapLoading(true);
      setShapErr("");
      try {
        const s = await fetchAnalyticsShap();
        if (!cancel) setShapData(s);
      } catch (e) {
        if (!cancel) {
          if (axios.isAxiosError(e) && (!e.response || e.code === "ERR_NETWORK")) {
            setShapErr("SHAP unavailable (API unreachable).");
          } else {
            setShapErr(getApiErrorMessage(e, "SHAP failed."));
          }
        }
      } finally {
        if (!cancel) setShapLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [data, err]);

  const heat = useMemo(() => pickCorrHeatmap(data?.correlations || {}, 15), [data]);

  const numericKeys = useMemo(() => Object.keys(data?.numeric_bins || {}), [data]);

  const catEntries = useMemo(() => Object.entries(data?.categorical || {}), [data]);

  if (err) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="HR Intelligence"
          title="Workforce"
          titleAccent="analytics"
          description="Analytics requires a running API."
        />
        <GlassCard className="p-6 border-rose-500/20">
          <p className="text-sm text-rose-100/95">{err}</p>
          <p className="text-[11px] text-emerald-700 font-mono mt-3">
            Example: from the project &quot;backend&quot; folder run{" "}
            <code className="text-emerald-500/90">uvicorn app:app --reload --port 8765</code> (match
            vite.config.js proxy).
          </p>
        </GlassCard>
      </div>
    );
  }

  const s = data?.summary;

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="HR Intelligence"
        title="Workforce"
        titleAccent="analytics"
        description="Feature-level attrition rates, category splits, multi-dimensional cohorts, correlations, SHAP global explanations, and auto-generated insights from your IBM HR dataset."
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-1.5 text-[11px] font-medium text-emerald-400/95">
          Recharts · pandas · SHAP
        </span>
      </PageHeader>

      {/* Summary KPIs */}
      <section>
        <SectionTitle
          title="Executive summary"
          subtitle="Headcount, modeled high-risk share, compensation and satisfaction baselines."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Total employees"
            value={loading ? "—" : s?.total_employees ?? "—"}
            sub="Rows in HR extract"
            loading={loading}
            delay={0}
          />
          <KpiCard
            title="High risk %"
            value={
              loading
                ? "—"
                : s?.high_risk_pct != null
                  ? `${s.high_risk_pct}%`
                  : "—"
            }
            sub={s?.high_risk_definition || "Model P(attrition) ≥ 50%"}
            variant="danger"
            loading={loading}
            delay={0.05}
          />
          <KpiCard
            title="Avg monthly income"
            value={loading ? "—" : s?.avg_monthly_income ?? "—"}
            sub="USD (dataset)"
            loading={loading}
            delay={0.1}
          />
          <KpiCard
            title="Avg satisfaction"
            value={loading ? "—" : s?.avg_job_satisfaction ?? "—"}
            sub="Job satisfaction (1–4)"
            loading={loading}
            delay={0.15}
          />
        </div>
        <p className="mt-3 text-[11px] text-emerald-700 font-mono">
          Historical attrition: {loading ? "…" : `${s?.attrition_rate_pct ?? "—"}%`} · Avg WLB:{" "}
          {loading ? "…" : s?.avg_work_life_balance ?? "—"} · Avg env. satisfaction:{" "}
          {loading ? "…" : s?.avg_environment_satisfaction ?? "—"}
        </p>
      </section>

      {/* Insights */}
      <section>
        <GlassCard className="p-6">
          <SectionTitle
            title="Generated HR insights"
            subtitle="Rule-based highlights from grouped rates, correlations, and segments."
          />
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 skeleton rounded w-full max-w-2xl" />
              ))}
            </div>
          ) : (
            <ul className="space-y-2.5 list-disc list-inside text-sm text-emerald-200/95 leading-relaxed">
              {(data?.insights || []).map((line, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  {line}
                </motion.li>
              ))}
            </ul>
          )}
        </GlassCard>
      </section>

      {/* Numeric bins */}
      <section>
        <SectionTitle
          title="Feature-level attrition"
          subtitle="Binned numerics and ordinal scales — attrition % and cohort size per group."
        />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {numericKeys.map((key) => {
            const series = (data?.numeric_bins || {})[key] || [];
            const chartData = series.map((r) => ({
              name: String(r.label).slice(0, 28),
              attrition: r.attrition_rate_pct,
              count: r.count,
            }));
            const useLine = ["JobSatisfaction", "WorkLifeBalance", "EnvironmentSatisfaction"].includes(
              key
            );
            return (
              <GlassCard key={key} className="p-5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 mb-4">
                  {key}
                </p>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {useLine ? (
                      <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#064e3b33" />
                        <XAxis dataKey="name" tick={{ fill: "#6ee7b799", fontSize: 10 }} />
                        <YAxis
                          tick={{ fill: "#6ee7b799", fontSize: 10 }}
                          label={{
                            value: "% attrition",
                            angle: -90,
                            position: "insideLeft",
                            fill: "#6ee7b799",
                            fontSize: 10,
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#022c22ee",
                            border: "1px solid #065f46",
                            borderRadius: 8,
                          }}
                          labelStyle={{ color: "#a7f3d0" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="attrition"
                          stroke="#34d399"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#10b981" }}
                          name="% attrition"
                        />
                      </LineChart>
                    ) : (
                      <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#064e3b33" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#6ee7b799", fontSize: 9 }}
                          interval={0}
                          angle={-25}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis
                          tick={{ fill: "#6ee7b799", fontSize: 10 }}
                          label={{
                            value: "% attrition",
                            angle: -90,
                            position: "insideLeft",
                            fill: "#6ee7b799",
                            fontSize: 10,
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#022c22ee",
                            border: "1px solid #065f46",
                            borderRadius: 8,
                          }}
                        />
                        <Bar dataKey="attrition" name="% attrition" fill="#34d399" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* Categorical */}
      <section>
        <SectionTitle
          title="Categorical analysis"
          subtitle="Attrition rate and headcount by department, gender, role, and more."
        />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {catEntries.map(([name, rows]) => {
            const barData = (rows || []).map((r) => ({
              name: String(r.label).slice(0, 22),
              attrition: r.attrition_rate_pct,
              count: r.count,
              pctEmp: r.pct_of_employees,
            }));
            const pieData = (rows || []).slice(0, 7).map((r, i) => ({
              name: String(r.label).slice(0, 18),
              value: r.count,
              fill: CHART_COLORS[i % CHART_COLORS.length],
            }));
            return (
              <GlassCard key={name} className="p-5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 mb-4">
                  {name}
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#064e3b33" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "#6ee7b799", fontSize: 10 }} domain={[0, "auto"]} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={100}
                          tick={{ fill: "#6ee7b799", fontSize: 9 }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#022c22ee",
                            border: "1px solid #065f46",
                            borderRadius: 8,
                          }}
                        />
                        <Bar dataKey="attrition" name="% attrition" fill="#2dd4bf" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={88}
                          paddingAngle={2}
                        >
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={pieData[i].fill} stroke="#022c22" />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#022c22ee",
                            border: "1px solid #065f46",
                            borderRadius: 8,
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* Cross-dimensional */}
      <section>
        <SectionTitle
          title="Multi-dimensional cohorts"
          subtitle="Stacked headcount by pair of dimensions; darker risk context in tooltips."
        />
        <div className="space-y-8">
          {(data?.cross || []).map((block, bi) => {
            const { data: stacked, keys, labels } = crossToStacked(block.rows || []);
            return (
              <GlassCard key={block.name || bi} className="p-5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 mb-4">
                  {block.name}
                </p>
                <div className="h-[320px] w-full overflow-x-auto">
                  <ResponsiveContainer width="100%" height="100%" minWidth={480}>
                    <BarChart data={stacked} margin={{ top: 8, right: 12, left: 4, bottom: 48 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#064e3b33" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#6ee7b799", fontSize: 9 }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={64}
                      />
                      <YAxis tick={{ fill: "#6ee7b799", fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#022c22ee",
                          border: "1px solid #065f46",
                          borderRadius: 8,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      {keys.map((k, i) => (
                        <Bar
                          key={k}
                          dataKey={k}
                          name={labels[i] || k}
                          stackId="a"
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* Correlation heatmap */}
      <section>
        <GlassCard className="p-6 overflow-x-auto">
          <SectionTitle
            title="Correlation structure"
            subtitle="Pearson matrix on numeric fields + attrition (_y). Subset ranked by |ρ| vs attrition."
          />
          {loading ? (
            <div className="h-64 skeleton rounded" />
          ) : (
            <div className="inline-block min-w-full">
              <table className="border-collapse text-[10px] font-mono">
                <thead>
                  <tr>
                    <th className="p-1 text-emerald-600" />
                    {heat.labels.map((lab) => (
                      <th
                        key={lab}
                        className="p-1 px-1.5 text-left text-emerald-500 max-w-[84px] truncate"
                        title={lab}
                      >
                        {lab}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heat.matrix.map((row, i) => (
                    <tr key={i}>
                      <td
                        className="p-1 pr-2 text-emerald-500 max-w-[100px] truncate align-middle"
                        title={heat.labels[i]}
                      >
                        {heat.labels[i]}
                      </td>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className="p-0.5"
                          title={`${heat.labels[i]} vs ${heat.labels[j]}: ${cell}`}
                        >
                          <div
                            className="min-w-[36px] h-7 flex items-center justify-center rounded border border-black/20 text-[9px] text-white/90"
                            style={{ backgroundColor: corrColor(cell) }}
                          >
                            {cell >= 0 ? cell.toFixed(2) : cell.toFixed(2)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </section>

      {/* Scatter pairs */}
      <section>
        <SectionTitle
          title="Feature interactions"
          subtitle="Scatter samples (color: attrition). Explore non-linear joint behavior."
        />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {(data?.scatter_pairs || []).map((sp) => {
            const pts = sp.points || [];
            const stayed = pts.filter((p) => !p.attrition);
            const left = pts.filter((p) => p.attrition);
            const trend = linearTrendLine(pts);
            return (
              <GlassCard key={sp.id} className="p-5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 mb-1">
                  {sp.title}
                </p>
                <p className="text-[11px] text-emerald-800 mb-3 font-mono">
                  {sp.xLabel} × {sp.yLabel}
                </p>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#064e3b33" />
                      <XAxis
                        type="number"
                        dataKey="x"
                        name={sp.xLabel}
                        tick={{ fill: "#6ee7b799", fontSize: 10 }}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name={sp.yLabel}
                        tick={{ fill: "#6ee7b799", fontSize: 10 }}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        contentStyle={{
                          background: "#022c22ee",
                          border: "1px solid #065f46",
                          borderRadius: 8,
                        }}
                      />
                      <Line
                        type="linear"
                        data={trend}
                        dataKey="y"
                        stroke="#fbbf24"
                        strokeWidth={2}
                        dot={false}
                        name="OLS trend"
                        isAnimationActive={false}
                      />
                      <Scatter name="Stayed" data={stayed} fill="#34d399" fillOpacity={0.8} />
                      <Scatter name="Left" data={left} fill="#fb7185" fillOpacity={0.85} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-[10px] text-emerald-700 font-mono">
                  Pink = left (Yes), green = stayed (No) · Gold line = linear trend (all points)
                </p>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* SHAP */}
      <section>
        <GlassCard className="p-6">
          <SectionTitle
            title="SHAP global explanation"
            subtitle="Mean |SHAP| on preprocessed features — loaded separately so the rest of the page stays fast."
          />
          {shapLoading ? (
            <div className="h-56 skeleton rounded" />
          ) : shapErr ? (
            <p className="text-sm text-amber-200/90 font-mono">{shapErr}</p>
          ) : shapData?.error ? (
            <p className="text-sm text-amber-200/90 font-mono">{shapData.error}</p>
          ) : (
            <>
              <p className="text-[11px] text-emerald-700 font-mono mb-4">
                Samples: {shapData?.n_samples_used ?? "—"} · Higher bar = stronger impact on
                attrition probability
              </p>
              <div className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={(shapData?.features || []).slice(0, 22)}
                    margin={{ left: 8, right: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#064e3b33" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#6ee7b799", fontSize: 10 }} />
                    <YAxis
                      type="category"
                      dataKey="feature"
                      width={220}
                      tick={{ fill: "#6ee7b799", fontSize: 9 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#022c22ee",
                        border: "1px solid #065f46",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="mean_abs_shap" name="Mean |SHAP|" fill="#a78bfa" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </GlassCard>
      </section>
    </div>
  );
}
