import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "../components/GlassCard.jsx";
import KpiCard from "../components/KpiCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import TrendChart from "../components/charts/TrendChart.jsx";
import DepartmentBar from "../components/charts/DepartmentBar.jsx";
import RiskScatter from "../components/charts/RiskScatter.jsx";
import {
  fetchDashboardStats,
  fetchTrends,
  fetchDepartments,
  fetchScatter,
} from "../services/api.js";

function ChartChrome({ title, subtitle }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-5 pb-4 border-b border-emerald-500/15">
      <div>
        <h2 className="font-display text-sm font-semibold text-white tracking-wide">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[11px] text-emerald-800/90 mt-1 font-mono">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [depts, setDepts] = useState(null);
  const [scatter, setScatter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const [s, t, d, sc] = await Promise.all([
          fetchDashboardStats(),
          fetchTrends(),
          fetchDepartments(),
          fetchScatter(),
        ]);
        if (!cancel) {
          setStats(s);
          setTrends(t);
          setDepts(d);
          setScatter(sc);
        }
      } catch (e) {
        if (!cancel) setErr(e?.message || "Failed to load dashboard");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="HR intelligence"
        title="Attrition"
        titleAccent="command center"
        description="Two modes: upload a CSV for automatic analytics, or run manual inference with SHAP-backed explanations. Built on your IBM HR dataset and RandomForest bundle."
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-1.5 text-[11px] font-medium text-emerald-400/95">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Live feed
        </span>
        <span className="rounded-full border border-emerald-500/20 bg-emerald-950/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-500/80">
          RF bundle
        </span>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 auto-rows-fr">
        {[
          {
            to: "/upload",
            title: "Upload & analyze",
            sub: "CSV → schema, charts, insights",
            accent: "from-emerald-600/30 to-teal-900/20",
          },
          {
            to: "/predict",
            title: "Manual prediction",
            sub: "Single employee risk + SHAP",
            accent: "from-violet-600/25 to-slate-900/20",
          },
          {
            to: "/analytics",
            title: "Deep analytics",
            sub: "Bundled dataset intelligence",
            accent: "from-cyan-600/25 to-slate-900/20",
          },
          {
            to: "/history",
            title: "History",
            sub: "Stored inference runs",
            accent: "from-amber-600/20 to-slate-900/20",
          },
        ].map((tile, i) => (
          <motion.div
            key={tile.to}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              to={tile.to}
              className={`block h-full rounded-xl border border-emerald-500/15 bg-gradient-to-br ${tile.accent} p-5 hover:border-emerald-500/35 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.08)] group`}
            >
              <p className="font-display text-sm font-semibold text-white group-hover:text-emerald-100">
                {tile.title}
              </p>
              <p className="text-[11px] text-emerald-700 font-mono mt-2 leading-snug">{tile.sub}</p>
              <span className="inline-flex mt-4 text-[10px] font-mono text-emerald-500/90">Open →</span>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/features"
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 hover:bg-white/[0.04] transition-colors"
        >
          <p className="text-sm font-medium text-slate-200">Global feature importance</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Model-level splits (RF)
          </p>
        </Link>
        <Link
          to="/employees"
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 hover:bg-white/[0.04] transition-colors"
        >
          <p className="text-sm font-medium text-slate-200">Full roster</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Dataset rows + live scores
          </p>
        </Link>
      </div>

      {err && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 text-sm text-amber-100/95">
          <span className="font-medium text-amber-200">Connection issue. </span>
          {err} Start the API (e.g. port 8001) and refresh.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total employees"
          value={loading ? "—" : stats?.total_employees ?? 0}
          sub="IBM HR dataset rows"
          variant="neutral"
          loading={loading}
          delay={0.04}
        />
        <KpiCard
          title="High risk"
          value={loading ? "—" : stats?.high_risk_count ?? 0}
          sub="Band: High"
          variant="danger"
          loading={loading}
          delay={0.08}
        />
        <KpiCard
          title="Avg attrition risk"
          value={
            loading ? "—" : `${(stats?.avg_attrition_risk ?? 0).toFixed(1)}%`
          }
          sub="Mean predicted probability"
          variant="default"
          loading={loading}
          delay={0.12}
        />
        <KpiCard
          title="Retention score"
          value={loading ? "—" : `${stats?.retention_score ?? 0}`}
          sub="Higher retains better"
          variant="success"
          loading={loading}
          delay={0.16}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <GlassCard variant="panel" delay={0.1}>
          <ChartChrome
            title="Attrition risk trend"
            subtitle="Average risk by employee cohort (CSV order) — dataset has no event dates."
          />
          <TrendChart data={trends} loading={loading} />
        </GlassCard>
        <GlassCard variant="panel" delay={0.14}>
          <ChartChrome
            title="Department exposure"
            subtitle="Mean predicted risk by org unit."
          />
          <DepartmentBar data={depts} loading={loading} />
        </GlassCard>
      </div>

      <GlassCard variant="panel" delay={0.18} glow>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5 pb-4 border-b border-emerald-500/15">
          <div>
            <h2 className="font-display text-sm font-semibold text-white tracking-wide">
              Satisfaction × work-life balance
            </h2>
            <p className="text-[11px] text-emerald-800/90 mt-1 max-w-lg font-mono">
              Each point is an employee. Color encodes predicted attrition risk.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-[10px] font-mono text-emerald-600">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />{" "}
              Low
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]" />{" "}
              Medium
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.45)]" />{" "}
              High
            </span>
          </div>
        </div>
        <RiskScatter data={scatter} loading={loading} />
      </GlassCard>
    </div>
  );
}
