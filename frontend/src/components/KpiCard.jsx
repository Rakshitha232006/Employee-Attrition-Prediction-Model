import { motion } from "framer-motion";

const barGrad = {
  default: "from-emerald-500 to-teal-500",
  danger: "from-rose-500 to-orange-500",
  success: "from-emerald-400 to-cyan-400",
  neutral: "from-slate-500 to-slate-600",
};

const orbGrad = {
  default: "from-emerald-500/30 to-cyan-500/15",
  danger: "from-rose-500/30 to-orange-500/15",
  success: "from-emerald-500/25 to-teal-600/15",
  neutral: "from-slate-500/20 to-slate-700/10",
};

export default function KpiCard({
  title,
  value,
  sub,
  variant = "default",
  delay = 0,
  loading = false,
}) {
  const bar = barGrad[variant] || barGrad.default;
  const orb = orbGrad[variant] || orbGrad.default;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-lg border border-emerald-500/15 bg-black/40 backdrop-blur-sm"
    >
      <div
        className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-gradient-to-b ${bar} opacity-90`}
      />
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${orb} blur-2xl opacity-50 transition-opacity group-hover:opacity-80`}
      />
      <div className="relative p-5 pl-6">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-emerald-600 mb-2">
          {title}
        </p>
        {loading ? (
          <div className="h-9 w-28 skeleton mb-1 rounded" />
        ) : (
          <p className="font-mono text-2xl md:text-[1.75rem] font-semibold tabular-nums text-emerald-100 tracking-tight">
            {value}
          </p>
        )}
        {sub && (
          <p className="text-xs text-emerald-800/90 mt-2 leading-snug">{sub}</p>
        )}
      </div>
    </motion.div>
  );
}
