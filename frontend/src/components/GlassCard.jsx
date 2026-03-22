import { motion } from "framer-motion";

const variants = {
  default: "rounded-lg glass p-5 md:p-6",
  panel: "rounded-lg panel-top p-5 md:p-6 bg-black/35 backdrop-blur-sm",
  quiet:
    "rounded-lg border border-emerald-500/12 bg-emerald-950/20 p-5 md:p-6",
};

export default function GlassCard({
  children,
  className = "",
  delay = 0,
  glow = false,
  variant = "default",
}) {
  const base = variants[variant] || variants.default;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={[
        base,
        glow ? "shadow-neon border-emerald-500/30" : "",
        className,
      ].join(" ")}
    >
      {children}
    </motion.div>
  );
}
