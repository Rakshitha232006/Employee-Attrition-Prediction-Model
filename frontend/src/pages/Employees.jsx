import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "../components/GlassCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { fetchEmployees } from "../services/api.js";

function rowAccent(risk) {
  if (risk === "High") return "border-l-rose-500";
  if (risk === "Medium") return "border-l-amber-500";
  return "border-l-transparent";
}

function riskBadge(risk) {
  const base =
    "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border";
  if (risk === "High") return `${base} text-rose-200 border-rose-500/35 bg-rose-500/10`;
  if (risk === "Medium")
    return `${base} text-amber-200 border-amber-500/35 bg-amber-500/10`;
  return `${base} text-emerald-200 border-emerald-500/35 bg-emerald-500/10`;
}

export default function Employees() {
  const [q, setQ] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let t;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchEmployees(q || undefined, riskFilter || undefined);
        setRows(data.employees || []);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [q, riskFilter]);

  const sorted = useMemo(
    () =>
      [...rows].sort(
        (a, b) => (b.attrition_risk || 0) - (a.attrition_risk || 0)
      ),
    [rows]
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Directory"
        title="Workforce"
        titleAccent="table"
        description="Search and slice by risk band. Rows come from the IBM HR CSV (one per EmployeeNumber) with model scores and actual turnover."
      />

      <GlassCard variant="panel" className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700 pointer-events-none">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Name, role, department…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="input-field sm:w-48 appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%2394a3b8%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')] bg-[length:1rem] bg-[right_0.65rem_center] bg-no-repeat pr-9"
          >
            <option value="">All risk levels</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </GlassCard>

      <GlassCard variant="panel" className="overflow-hidden !p-0">
        <div className="overflow-x-auto scroll-thin">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-emerald-500/15 bg-emerald-950/30">
                <th className="px-4 py-3 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-emerald-600">
                  #
                </th>
                <th className="px-4 py-3 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-emerald-600">
                  Employee
                </th>
                <th className="px-4 py-3 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-emerald-600">
                  Role
                </th>
                <th className="px-4 py-3 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-emerald-600">
                  Dept
                </th>
                <th className="px-4 py-3 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-emerald-600">
                  Income
                </th>
                <th className="px-4 py-3 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-emerald-600">
                  Tenure
                </th>
                <th className="px-4 py-3 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-emerald-600">
                  Sat / WLB
                </th>
                <th className="px-4 py-3 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-emerald-600">
                  OT
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-emerald-600">
                  Risk
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-emerald-600">
                  Band
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-emerald-600">
                  Actual
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-16 text-center">
                    <div className="inline-flex h-8 w-48 skeleton rounded" />
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-16 text-center text-slate-500 text-sm">
                    No rows match these filters.
                  </td>
                </tr>
              ) : (
                sorted.map((e, idx) => (
                  <motion.tr
                    key={e.id}
                    layout
                    className={`border-b border-emerald-500/10 border-l-4 ${rowAccent(
                      e.risk_level
                    )} hover:bg-white/[0.02] transition-colors`}
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-100">
                      {e.name}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{e.job_role}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {e.department}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300 tabular-nums text-xs">
                      {Number(e.income).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                      {e.years_at_company}y
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                      {e.satisfaction} / {e.work_life_balance}
                    </td>
                    <td className="px-4 py-3">
                      {e.overtime ? (
                        <span className="text-amber-300/90 text-xs font-medium">
                          Yes
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-200 tabular-nums text-xs">
                      {e.attrition_risk != null
                        ? `${(e.attrition_risk * 100).toFixed(1)}%`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={riskBadge(e.risk_level)}>
                        {e.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {e.actual_attrition === true ? (
                        <span className="text-[10px] font-mono text-rose-300/90">Left</span>
                      ) : e.actual_attrition === false ? (
                        <span className="text-[10px] font-mono text-emerald-600/90">Stayed</span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
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
