import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import GlassCard from "../components/GlassCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { fetchHistoryAnalytics, fetchPredictionHistory } from "../services/api.js";

export default function History() {
  const [rows, setRows] = useState([]);
  const [agg, setAgg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      try {
        const [p, a] = await Promise.all([
          fetchPredictionHistory(200),
          fetchHistoryAnalytics(),
        ]);
        if (!c) {
          setRows(p.predictions || []);
          setAgg(a);
        }
      } catch {
        if (!c) {
          setRows([]);
          setAgg(null);
        }
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const byDept = agg?.by_department || [];
  const byRisk = agg?.by_risk || [];

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <PageHeader
        eyebrow="Audit trail"
        title="Prediction"
        titleAccent="history"
        description="Manual inference runs stored in SQLite — slice by department, gender, and risk for operational review."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <p className="text-[10px] font-mono uppercase text-emerald-600">Total stored</p>
          <p className="text-2xl font-mono text-emerald-100 mt-1">
            {loading ? "—" : agg?.total_predictions ?? 0}
          </p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-5">
          <h2 className="font-display text-sm font-semibold text-white mb-4">By department</h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDept} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#064e3b33" />
                <XAxis type="number" tick={{ fill: "#6ee7b799", fontSize: 10 }} />
                <YAxis type="category" dataKey="department" width={120} tick={{ fill: "#6ee7b799", fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "#022c22ee", border: "1px solid #065f46" }} />
                <Bar dataKey="count" fill="#34d399" name="Count" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <h2 className="font-display text-sm font-semibold text-white mb-4">Risk distribution</h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byRisk}>
                <CartesianGrid strokeDasharray="3 3" stroke="#064e3b33" />
                <XAxis dataKey="risk_level" tick={{ fill: "#6ee7b799", fontSize: 10 }} />
                <YAxis tick={{ fill: "#6ee7b799", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#022c22ee", border: "1px solid #065f46" }} />
                <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-emerald-500/15 bg-emerald-950/30">
                <th className="px-4 py-3 text-[10px] font-mono uppercase text-emerald-600">Time</th>
                <th className="px-4 py-3 text-[10px] font-mono uppercase text-emerald-600">Dept</th>
                <th className="px-4 py-3 text-[10px] font-mono uppercase text-emerald-600">Gender</th>
                <th className="px-4 py-3 text-[10px] font-mono uppercase text-emerald-600">Age</th>
                <th className="px-4 py-3 text-[10px] font-mono uppercase text-emerald-600 text-right">P(attr)</th>
                <th className="px-4 py-3 text-[10px] font-mono uppercase text-emerald-600 text-right">Band</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No predictions yet. Run a manual prediction first.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-emerald-500/10 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{r.created_at || "—"}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{r.department || "—"}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{r.gender || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.age}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-emerald-200">
                      {(r.probability * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      <span
                        className={
                          r.risk_level === "High"
                            ? "text-rose-300"
                            : r.risk_level === "Medium"
                              ? "text-amber-300"
                              : "text-emerald-400"
                        }
                      >
                        {r.risk_level}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
