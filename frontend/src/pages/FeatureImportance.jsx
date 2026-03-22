import { useEffect, useState } from "react";
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
import { fetchModelFeatureImportance } from "../services/api.js";

export default function FeatureImportance() {
  const [feats, setFeats] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const d = await fetchModelFeatureImportance();
        if (!c) setFeats(d.features || []);
      } catch (e) {
        if (!c) setErr(e?.response?.data?.detail || e?.message || "Failed to load");
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const chartData = feats.map((f) => ({
    name: String(f.feature).replace(/^num__|^cat__/, "").slice(0, 42),
    value: Math.round(f.value * 10000) / 10000,
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        eyebrow="Model"
        title="Global"
        titleAccent="importance"
        description="RandomForest split importances on preprocessed features from the trained IBM HR bundle."
      />

      {err && (
        <GlassCard className="p-4 border-rose-500/25">
          <p className="text-sm text-rose-200">{err}</p>
        </GlassCard>
      )}

      <GlassCard className="p-6">
        <div className="h-[520px]">
          {loading ? (
            <div className="h-full skeleton rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#064e3b33" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#6ee7b799", fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={280} tick={{ fill: "#6ee7b799", fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ background: "#022c22ee", border: "1px solid #065f46", borderRadius: 8 }}
                />
                <Bar dataKey="value" fill="#34d399" name="Importance" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
