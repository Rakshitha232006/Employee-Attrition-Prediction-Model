import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import GlassCard from "../components/GlassCard.jsx";
import { login, register } from "../services/api.js";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.endsWith(".ocm")) {
      setError("Email domain looks mistyped (.ocm). Did you mean .com?");
      return;
    }
    setLoading(true);
    try {
      const data =
        mode === "login"
          ? await login(normalizedEmail, password)
          : await register(normalizedEmail, password, name);
      localStorage.setItem("token", data.access_token);
      navigate("/", { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      let msg = "Authentication failed";

      if (typeof detail === "string") {
        msg = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0];
        if (typeof first === "string") {
          msg = first;
        } else if (first?.msg) {
          msg = first.msg;
        }
      } else if (typeof err?.message === "string" && err.message) {
        msg = err.message;
      }

      if (msg.toLowerCase().includes("valid email")) {
        msg = "Invalid email format. Please check for typos like .ocm vs .com.";
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="guardian-shell min-h-screen flex">
      <div className="hidden lg:flex lg:w-[42%] relative border-r border-emerald-500/15 bg-gradient-to-br from-emerald-950/40 via-[#020403] to-black p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-emerald-900/50 to-black border border-emerald-500/40 flex items-center justify-center shadow-neon">
              <span className="font-display text-lg font-bold text-white">A</span>
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-600">
                Employee Attrition
              </p>
              <p className="font-display text-lg font-bold text-white tracking-wide">
                Prediction Model
              </p>
            </div>
          </div>
          <h2 className="font-display text-3xl font-semibold text-white leading-tight max-w-sm">
            Workforce risk, without the spreadsheet aesthetic.
          </h2>
          <p className="text-emerald-800/90 text-sm mt-4 max-w-sm leading-relaxed font-mono">
            JWT-backed sessions for the API. You can still browse the dashboard
            without signing in.
          </p>
        </div>
        <p className="text-[11px] text-slate-600">
          Internal analytics · Not financial advice
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-900/50 to-black border border-emerald-500/40 text-lg font-bold text-emerald-400 mb-4">
              A
            </div>
            <h1 className="font-display text-2xl font-semibold text-white">
              Sign in
            </h1>
          </div>

          <GlassCard variant="panel" className="lg:!shadow-none lg:!border-white/[0.06]">
            <div className="hidden lg:block mb-8">
              <h1 className="font-display text-2xl font-semibold text-white">
                {mode === "login" ? "Welcome back" : "Create account"}
              </h1>
              <p className="text-slate-500 text-sm mt-2">
                {mode === "login"
                  ? "Use your work email to receive a session token."
                  : "Register to persist JWT access for API calls."}
              </p>
            </div>

            <div className="flex rounded-lg bg-[#080d14] p-1 mb-6 border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  mode === "login"
                    ? "bg-white/[0.08] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  mode === "register"
                    ? "bg-white/[0.08] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Sign up
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              {mode === "register" && (
                <label className="block space-y-2">
                  <span className="label-upper">Name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                    placeholder="Jordan Kim"
                  />
                </label>
              )}
              <label className="block space-y-2">
                <span className="label-upper">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@company.com"
                />
              </label>
              <label className="block space-y-2">
                <span className="label-upper">Password</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                />
              </label>
              {error && (
                <p className="text-sm text-red-200 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2.5">
                  {error}
                </p>
              )}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full rounded-md font-mono text-sm uppercase tracking-wider bg-gradient-to-r from-emerald-700 to-teal-800 py-3 font-semibold text-white border border-emerald-500/30 disabled:opacity-45"
              >
                {loading
                  ? "Please wait…"
                  : mode === "login"
                    ? "Sign in"
                    : "Create account"}
              </motion.button>
            </form>
          </GlassCard>
          <p className="text-center text-slate-600 text-xs mt-6">
            <Link to="/" className="text-emerald-500/90 hover:text-emerald-400 font-mono text-xs">
              Continue without signing in →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
