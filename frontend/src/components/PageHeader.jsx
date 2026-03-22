/**
 * Consistent page chrome: eyebrow, display title, optional accent word, description.
 */
export default function PageHeader({
  eyebrow,
  title,
  titleAccent,
  description,
  children,
}) {
  return (
    <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-emerald-500/80 mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[1.65rem] sm:text-3xl md:text-[2rem] font-bold text-white tracking-tight leading-[1.15]">
          {title}
          {titleAccent && (
            <>
              {" "}
              <span className="text-gradient">{titleAccent}</span>
            </>
          )}
        </h1>
        {description && (
          <p className="text-emerald-800/90 mt-3 text-sm leading-relaxed max-w-xl">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{children}</div>
      )}
    </header>
  );
}
