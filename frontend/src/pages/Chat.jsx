import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { sendChatMessage } from "../services/api.js";

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask about risk bands, overtime, confidence scores, or how to read the dashboard.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottom = useRef(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    const t = input.trim();
    if (!t || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: t }]);
    setLoading(true);
    try {
      const { reply } = await sendChatMessage(t);
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Could not reach the assistant API. Is the backend running?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        eyebrow="Copilot"
        title="Insight"
        titleAccent="assistant"
        description="Rule-based responses for HR concepts — fast, no chain-of-thought theater."
      />

      <GlassCard variant="panel" className="!p-0 flex flex-col h-[min(72vh,580px)] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-emerald-500/15 flex items-center justify-between bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/35">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.455 0 2.867-.422 4.175-1.277 0-1.477.78-2.968 2.044-3.996z" />
              </svg>
            </span>
            <div>
              <p className="text-xs font-medium text-white">Session</p>
              <p className="text-[10px] text-slate-500">Attrition Q&amp;A</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-400/90">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Ready
          </span>
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin p-4 md:p-5 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={
                    m.role === "user"
                      ? "h-8 w-8 shrink-0 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-semibold text-slate-300"
                      : "h-8 w-8 shrink-0 rounded-full bg-emerald-950/80 ring-1 ring-emerald-500/35 flex items-center justify-center"
                  }
                >
                  {m.role === "user" ? (
                    "You"
                  ) : (
                    <span className="text-emerald-400 text-xs font-display font-bold">
                      AI
                    </span>
                  )}
                </div>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-tr-md px-4 py-2.5 bg-emerald-900/40 border border-emerald-500/25 text-sm text-emerald-50 leading-relaxed"
                      : "max-w-[85%] rounded-2xl rounded-tl-md px-4 py-2.5 bg-[#080d14] border border-white/[0.08] text-sm text-slate-400 leading-relaxed"
                  }
                >
                  {m.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex gap-3 pl-11">
              <div className="flex gap-1 pt-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" />
              </div>
            </div>
          )}
          <div ref={bottom} />
        </div>
        <form
          onSubmit={send}
          className="p-3 md:p-4 border-t border-emerald-500/15 flex gap-2 bg-black/50"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            className="input-field flex-1"
          />
          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="rounded-md px-5 py-2.5 font-mono text-xs uppercase tracking-wider font-semibold bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500/40 disabled:opacity-40 shrink-0"
          >
            Send
          </motion.button>
        </form>
      </GlassCard>
    </div>
  );
}
