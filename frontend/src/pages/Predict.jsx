import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import RiskGauge from "../components/RiskGauge.jsx";
import { predict, fetchJobRoles, fetchMetaOptions } from "../services/api.js";

const JOB_ROLES_FALLBACK = [
  "Healthcare Representative",
  "Human Resources",
  "Laboratory Technician",
  "Manager",
  "Manufacturing Director",
  "Research Director",
  "Research Scientist",
  "Sales Executive",
  "Sales Representative",
];

function riskPanelClass(level) {
  if (level === "High")
    return "border-rose-500/35 bg-gradient-to-br from-rose-950/50 to-[#0a0f18]";
  if (level === "Medium")
    return "border-amber-500/30 bg-gradient-to-br from-amber-950/35 to-[#0a0f18]";
  return "border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-[#0a0f18]";
}

function riskBadgeClass(level) {
  if (level === "High")
    return "bg-rose-500/15 text-rose-200 border-rose-500/30";
  if (level === "Medium")
    return "bg-amber-500/15 text-amber-200 border-amber-500/30";
  return "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
}

export default function Predict() {
  const [jobRoles, setJobRoles] = useState(JOB_ROLES_FALLBACK);
  const [departments, setDepartments] = useState(["Research & Development"]);
  const [genders, setGenders] = useState(["Male", "Female"]);

  useEffect(() => {
    fetchJobRoles()
      .then((roles) => {
        if (roles?.length) setJobRoles(roles);
      })
      .catch(() => {});
    fetchMetaOptions()
      .then((o) => {
        if (o?.departments?.length) setDepartments(o.departments);
        if (o?.genders?.length) setGenders(o.genders);
      })
      .catch(() => {});
  }, []);

  const [form, setForm] = useState({
    age: 35,
    job_role: "Research Scientist",
    department: "Research & Development",
    gender: "Male",
    income: 6500,
    years_at_company: 5,
    satisfaction: 3,
    work_life_balance: 3,
    environment_satisfaction: 3,
    distance_from_home: 10,
    overtime: false,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await predict({
        age: Number(form.age),
        job_role: form.job_role,
        department: form.department,
        gender: form.gender,
        income: Number(form.income),
        years_at_company: Number(form.years_at_company),
        satisfaction: Number(form.satisfaction),
        work_life_balance: Number(form.work_life_balance),
        environment_satisfaction: Number(form.environment_satisfaction),
        distance_from_home: Number(form.distance_from_home),
        overtime: Boolean(form.overtime),
      });
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const pct = result ? Math.round(result.probability * 1000) / 10 : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <PageHeader
        eyebrow="Manual mode"
        title="Individual"
        titleAccent="risk analysis"
        description="Inputs map to the trained IBM feature vector. SHAP values show which factors push toward attrition vs retention for this row."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">
        <GlassCard variant="panel" className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="font-display text-sm font-semibold text-white">
              Input signals
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              All fields map directly to the trained feature vector.
            </p>
          </div>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
              <label className="block space-y-2">
                <span className="label-upper">Age</span>
                <input
                  type="number"
                  min={18}
                  max={70}
                  value={form.age}
                  onChange={(e) => onChange("age", e.target.value)}
                  className="input-field"
                />
              </label>
              <label className="block space-y-2 sm:col-span-2">
                <span className="label-upper">Job role</span>
                <select
                  value={form.job_role}
                  onChange={(e) => onChange("job_role", e.target.value)}
                  className="input-field appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%2394a3b8%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')] bg-[length:1rem] bg-[right_0.65rem_center] bg-no-repeat pr-9"
                >
                  {jobRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="label-upper">Department</span>
                <select
                  value={form.department}
                  onChange={(e) => onChange("department", e.target.value)}
                  className="input-field appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%2394a3b8%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')] bg-[length:1rem] bg-[right_0.65rem_center] bg-no-repeat pr-9"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="label-upper">Gender</span>
                <select
                  value={form.gender}
                  onChange={(e) => onChange("gender", e.target.value)}
                  className="input-field appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%2394a3b8%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')] bg-[length:1rem] bg-[right_0.65rem_center] bg-no-repeat pr-9"
                >
                  {genders.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="label-upper">Monthly income</span>
                <input
                  type="number"
                  min={1}
                  step={100}
                  value={form.income}
                  onChange={(e) => onChange("income", e.target.value)}
                  className="input-field font-mono tabular-nums"
                />
              </label>
              <label className="block space-y-2">
                <span className="label-upper">Years at company</span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={form.years_at_company}
                  onChange={(e) => onChange("years_at_company", e.target.value)}
                  className="input-field font-mono tabular-nums"
                />
              </label>
              <label className="block space-y-2">
                <span className="label-upper">Distance from home (mi)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.distance_from_home}
                  onChange={(e) => onChange("distance_from_home", e.target.value)}
                  className="input-field font-mono tabular-nums"
                />
              </label>
              <label className="block space-y-2 sm:col-span-2">
                <div className="flex justify-between">
                  <span className="label-upper">Job satisfaction</span>
                  <span className="text-xs font-mono text-emerald-300 tabular-nums">
                    {form.satisfaction}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={form.satisfaction}
                  onChange={(e) => onChange("satisfaction", e.target.value)}
                  className="w-full h-1.5 rounded-full appearance-none bg-white/[0.08] accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                  <span>1</span>
                  <span>5</span>
                </div>
              </label>
              <label className="block space-y-2 sm:col-span-2">
                <div className="flex justify-between">
                  <span className="label-upper">Work-life balance</span>
                  <span className="text-xs font-mono text-sky-300 tabular-nums">
                    {form.work_life_balance}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={form.work_life_balance}
                  onChange={(e) =>
                    onChange("work_life_balance", e.target.value)
                  }
                  className="w-full h-1.5 rounded-full appearance-none bg-white/[0.08] accent-sky-500"
                />
                <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                  <span>1</span>
                  <span>5</span>
                </div>
              </label>
              <label className="block space-y-2 sm:col-span-2">
                <div className="flex justify-between">
                  <span className="label-upper">Environment satisfaction</span>
                  <span className="text-xs font-mono text-violet-300 tabular-nums">
                    {form.environment_satisfaction}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={form.environment_satisfaction}
                  onChange={(e) => onChange("environment_satisfaction", e.target.value)}
                  className="w-full h-1.5 rounded-full appearance-none bg-white/[0.08] accent-violet-500"
                />
                <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                  <span>1</span>
                  <span>5</span>
                </div>
              </label>
              <div className="flex items-center justify-between sm:col-span-2 rounded-lg border border-white/[0.08] bg-[#080d14] px-4 py-3 hover:border-white/[0.12] transition-colors">
                <span className="text-sm text-slate-300">Works overtime</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.overtime}
                  onClick={() => onChange("overtime", !form.overtime)}
                  className={[
                    "relative h-7 w-12 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40",
                    form.overtime ? "bg-emerald-600" : "bg-slate-800",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform",
                      form.overtime ? "left-6" : "left-1",
                    ].join(" ")}
                  />
                </button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-200 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2.5">
                {typeof error === "string" ? error : JSON.stringify(error)}
              </p>
            )}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.008 }}
              whileTap={{ scale: 0.992 }}
              className="w-full rounded-md font-mono text-sm uppercase tracking-wider bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 shadow-neon border border-emerald-500/30 disabled:opacity-45 disabled:pointer-events-none"
            >
              {loading ? "Running inference…" : "Run prediction"}
            </motion.button>
          </form>
        </GlassCard>

        <div className="lg:col-span-3 space-y-5">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="out"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className={`rounded-2xl border p-6 md:p-8 ${riskPanelClass(result.risk_level)}`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-8">
                  <RiskGauge percent={pct} />
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-[0.2em] px-2.5 py-1 rounded-md border ${riskBadgeClass(result.risk_level)}`}
                      >
                        {result.risk_level} risk
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Confidence{" "}
                        <span className="font-mono text-slate-300">
                          {result.confidence}
                        </span>
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Probability of attrition under the current model. Use the
                      band as a triage signal, not a verdict.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] px-8 py-14 text-center"
              >
                <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                  Outputs appear here: probability, band, explanations, and
                  retention recommendations.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {result && (
            <>
              <GlassCard variant="quiet" delay={0.05}>
                <h3 className="font-display text-sm font-semibold text-white mb-4">
                  Model narrative
                </h3>
                <ul className="space-y-3">
                  {result.reasons?.map((r, i) => (
                    <li
                      key={i}
                      className="text-sm text-slate-400 leading-relaxed flex gap-3"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                      {r}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-6 border-t border-white/[0.06]">
                  <p className="label-upper mb-3">Feature importance</p>
                  <div className="flex flex-wrap gap-2">
                    {result.feature_importance?.slice(0, 5).map((f) => (
                      <span
                        key={f.feature}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-400 font-mono"
                      >
                        {f.feature}{" "}
                        <span className="text-slate-300">
                          {(f.value * 100).toFixed(0)}%
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </GlassCard>
              <GlassCard variant="quiet" delay={0.08}>
                <h3 className="font-display text-sm font-semibold text-white mb-4">
                  SHAP (local explanation)
                </h3>
                {result.shap_explanations?.length ? (
                  <ul className="space-y-2.5">
                    {result.shap_explanations.map((s, i) => (
                      <li
                        key={i}
                        className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono border border-white/[0.06] rounded-lg px-3 py-2"
                      >
                        <span className="text-slate-400 truncate max-w-[65%]">{s.feature}</span>
                        <span
                          className={
                            s.effect === "increases_risk"
                              ? "text-rose-300"
                              : "text-emerald-400"
                          }
                        >
                          {s.effect === "increases_risk" ? "+ risk" : "− risk"} ·{" "}
                          {s.shap_value}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">
                    SHAP unavailable (install `shap` on the API or check model).
                  </p>
                )}
              </GlassCard>
              <GlassCard variant="quiet" delay={0.1}>
                <h3 className="font-display text-sm font-semibold text-white mb-4">
                  Retention plays
                </h3>
                <ul className="space-y-3">
                  {result.recommendations?.map((r, i) => (
                    <li
                      key={i}
                      className="text-sm text-slate-300 leading-relaxed flex gap-3"
                    >
                      <span className="text-emerald-500/90 font-mono text-xs mt-0.5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
