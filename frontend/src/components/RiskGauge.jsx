/**
 * Radial readout for attrition probability — reads as instrument, not plain text.
 */
export default function RiskGauge({ percent }) {
  const p = Math.min(100, Math.max(0, percent));
  const rot = (p / 100) * 360;

  return (
    <div className="relative mx-auto flex h-44 w-44 shrink-0 items-center justify-center">
      <div
        className="absolute inset-0 rounded-full p-[3px]"
        style={{
          background: `conic-gradient(from -90deg, rgb(52 211 153 / 0.55) ${rot}deg, rgb(255 255 255 / 0.05) ${rot}deg)`,
        }}
      />
      <div className="absolute inset-[3px] rounded-full bg-[#020403]" />
      <div className="relative z-10 text-center">
        <p className="font-mono text-4xl font-bold tabular-nums text-emerald-100 tracking-tight">
          {p.toFixed(1)}
          <span className="text-lg text-emerald-600 font-semibold">%</span>
        </p>
        <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-emerald-600 mt-1">
          P(attrition)
        </p>
      </div>
    </div>
  );
}
