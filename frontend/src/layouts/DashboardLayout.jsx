import { motion } from "framer-motion";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

const nav = [
  {
    to: "/",
    label: "Overview",
    end: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    to: "/upload",
    label: "Upload",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    to: "/predict",
    label: "Manual",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
  {
    to: "/analytics",
    label: "Analytics",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    to: "/history",
    label: "History",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: "/features",
    label: "Importance",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    to: "/employees",
    label: "Roster",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    to: "/chat",
    label: "Assistant",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.455 0 2.867-.422 4.175-1.277 0-1.477.78-2.968 2.044-3.996z" />
      </svg>
    ),
  },
];

function StatusBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const ts = now.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  return (
    <div className="hidden md:flex h-11 shrink-0 border-b border-emerald-500/15 bg-black/50 items-center justify-between px-6 lg:px-8">
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-500/80 max-w-[70%]">
        <span className="text-emerald-300/95 truncate">
          Employee Attrition Prediction Model
        </span>
      </div>
      <div className="flex items-center gap-6 font-mono text-[10px] text-emerald-600/90">
        <span className="hidden sm:inline">{ts}</span>
        <span className="flex items-center gap-2 text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          UPLINK ACTIVE
        </span>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  }, [navigate]);

  return (
    <div className="guardian-shell">
      <div className="relative z-10 flex min-h-screen">
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="hidden md:flex w-[260px] min-h-screen flex-col glass-strong px-4 py-6 lg:px-5"
        >
          <div className="mb-10 flex items-center gap-3">
            <div className="relative">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-950 to-black border border-emerald-500/40 flex items-center justify-center shadow-neon">
                <svg className="w-7 h-7 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L6 5v6c0 5.25 3.5 9.74 6 11 2.5-1.26 6-5.75 6-11V5l-6-3zm0 2.18l4 2.22v4.6c0 4.12-2.55 7.76-4 8.87-1.45-1.11-4-4.75-4-8.87V6.4l4-2.22z" />
                </svg>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#030806]" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-600 leading-tight">
                Employee Attrition
              </p>
              <p className="font-display text-[13px] font-bold text-white tracking-wide leading-snug">
                Prediction Model
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition-all border-l-2",
                    isActive
                      ? "border-emerald-400 bg-emerald-500/10 text-emerald-100 shadow-[inset_0_0_20px_rgba(16,185,129,0.08)]"
                      : "border-transparent text-emerald-800/90 hover:text-emerald-200 hover:bg-emerald-500/5",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={
                        isActive
                          ? "text-emerald-400"
                          : "text-emerald-700 group-hover:text-emerald-500"
                      }
                    >
                      {item.icon}
                    </span>
                    <span className="font-mono text-xs tracking-wide">{item.label}</span>
                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-sm bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-8 space-y-3 border-t border-emerald-500/10">
            <div className="rounded-md border border-emerald-500/20 bg-emerald-950/40 px-3 py-2 font-mono text-[10px] text-emerald-500/80">
              <p className="text-emerald-600 uppercase tracking-wider">Model</p>
              <p className="text-emerald-400/90 mt-1">RF · ATTRITION</p>
            </div>
            {token ? (
              <button
                type="button"
                onClick={logout}
                className="w-full rounded-md border border-emerald-500/20 bg-transparent px-3 py-2.5 font-mono text-xs text-emerald-600 hover:text-emerald-300 hover:bg-emerald-500/5 transition-colors"
              >
                [ SIGN OUT ]
              </button>
            ) : (
              <NavLink
                to="/login"
                className="block w-full rounded-md border border-emerald-500/35 bg-emerald-500/10 px-3 py-2.5 text-center font-mono text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
              >
                AUTHENTICATE
              </NavLink>
            )}
          </div>
        </motion.aside>

        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          <StatusBar />
          <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-emerald-500/15 bg-black/70 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg border border-emerald-500/30 bg-emerald-950/50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L6 5v6c0 5.25 3.5 9.74 6 11 2.5-1.26 6-5.75 6-11V5l-6-3z" />
                </svg>
              </div>
              <span className="font-display font-bold text-[11px] text-white tracking-wide leading-tight max-w-[140px]">
                Attrition Model
              </span>
            </div>
            <nav className="flex gap-1 overflow-x-auto max-w-[58%] scroll-thin">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      "shrink-0 rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wide",
                      isActive
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "text-emerald-700",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6 md:px-10 md:py-8 max-w-[1680px] mx-auto w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
