"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { api, apiFetch } from "@/lib/api";
import { Zap, AlertCircle, Code2, TrendingUp, Users, DollarSign, BarChart2 } from "lucide-react";

interface Metrics {
  total_users: number;
  new_users_7d: number;
  total_generations: number;
  generations_7d: number;
  demo_runs: number;
  demo_runs_7d: number;
  total_ai_cost_usd: number;
  cost_7d: number;
  avg_cost_per_gen: number;
  plan_distribution: Record<string, number>;
  conversion_rate: number;
}

export default function FounderPage() {
  const { isLoaded } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentErrors, setRecentErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genId, setGenId] = useState("");
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    apiFetch<any>("/admin/metrics")
      .then(m => setMetrics(m))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [isLoaded]);

  async function loadAiLogs() {
    if (!genId.trim()) return;
    setLogsLoading(true);
    try {
      const res = await api.generations.aiLogs(genId.trim()) as any;
      setAiLogs(res.ai_logs ?? []);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLogsLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-zinc-400">Loading founder dashboard...</div>;
  if (error) return (
    <div className="p-8 flex items-center gap-3 text-red-400">
      <AlertCircle className="w-5 h-5" /> {error}
    </div>
  );

  const STAT_CARDS = [
    { label: "Total Users",      value: metrics?.total_users ?? 0,                  sub: `+${metrics?.new_users_7d ?? 0} this week`,   icon: <Users className="w-5 h-5" />,      color: "text-blue-400" },
    { label: "Generations",      value: metrics?.total_generations ?? 0,             sub: `+${metrics?.generations_7d ?? 0} this week`, icon: <Zap className="w-5 h-5" />,        color: "text-violet-400" },
    { label: "Demo Runs",        value: metrics?.demo_runs ?? 0,                     sub: `+${metrics?.demo_runs_7d ?? 0} this week`,   icon: <TrendingUp className="w-5 h-5" />, color: "text-green-400" },
    { label: "AI Cost (7d)",     value: `$${(metrics?.cost_7d ?? 0).toFixed(2)}`,    sub: `$${(metrics?.avg_cost_per_gen ?? 0).toFixed(3)} per gen`, icon: <DollarSign className="w-5 h-5" />, color: "text-amber-400" },
  ];

  return (
    <div className="p-8 max-w-6xl space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
          <Code2 className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Founder Dashboard</h1>
          <p className="text-sm text-zinc-400">Unlimited access · AI logs · Full metrics</p>
        </div>
        <span className="ml-auto badge badge-violet">FOUNDER MODE</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wide">{s.label}</span>
              <span className={s.color}>{s.icon}</span>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-zinc-600 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Plan distribution */}
      {metrics?.plan_distribution && (
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-zinc-400" /> Plan Distribution
          </h2>
          <div className="space-y-3">
            {Object.entries(metrics.plan_distribution).map(([plan, count]) => {
              const total = Object.values(metrics.plan_distribution).reduce((a, b) => a + b, 0);
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <div key={plan} className="flex items-center gap-3">
                  <span className="w-16 text-xs text-zinc-400 capitalize">{plan}</span>
                  <div className="flex-1 h-2 bg-[#27272a] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm text-zinc-300 w-8 text-right">{count}</span>
                  <span className="text-xs text-zinc-600 w-8">{pct}%</span>
                </div>
              );
            })}
          </div>
          {metrics.conversion_rate > 0 && (
            <p className="text-xs text-zinc-500 mt-4">
              Free → Paid conversion: <span className="text-green-400 font-medium">{metrics.conversion_rate.toFixed(1)}%</span>
            </p>
          )}
        </div>
      )}

      {/* AI Log Inspector */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Code2 className="w-4 h-4 text-violet-400" /> AI Log Inspector
        </h2>
        <p className="text-xs text-zinc-500">View raw prompts and responses for any founder-mode generation</p>
        <div className="flex gap-3">
          <input
            className="input flex-1 text-sm font-mono"
            placeholder="Generation ID (UUID)"
            value={genId}
            onChange={e => setGenId(e.target.value)}
          />
          <button onClick={loadAiLogs} disabled={logsLoading} className="btn-primary text-sm px-5">
            {logsLoading ? "Loading..." : "Load Logs"}
          </button>
        </div>
        {aiLogs.length > 0 && (
          <div className="space-y-4 mt-2">
            {aiLogs.map((log, i) => (
              <div key={i} className="bg-[#0a0a0f] rounded-lg border border-[#27272a] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-[#27272a] bg-[#111118]">
                  <span className="badge badge-violet text-xs">{log.agent}</span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-[#27272a]">
                  <div className="p-4">
                    <p className="text-xs text-zinc-500 mb-2 font-medium">PROMPT</p>
                    <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-64">
                      {log.prompt}
                    </pre>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-zinc-500 mb-2 font-medium">RESPONSE</p>
                    <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-64">
                      {log.response}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
