"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import {
  Users, TrendingUp, DollarSign, Activity, AlertCircle,
  FileText, Zap, BarChart2
} from "lucide-react";

interface Metrics {
  total_users: number;
  new_users_30d: number;
  total_reports: number;
  reports_30d: number;
  mrr: number;
  arr: number;
  total_ai_cost_usd: number;
  ai_cost_30d: number;
  plan_distribution: Record<string, number>;
}

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  plan_tier: string;
  reports_used: number;
  created_at: string;
}

const PLAN_BADGE: Record<string, string> = {
  free:    "bg-gray-700 text-gray-300",
  starter: "bg-blue-900/40 text-blue-400",
  pro:     "bg-violet-900/40 text-violet-400",
  agency:  "bg-amber-900/40 text-amber-400",
};

export default function AdminPage() {
  const { isLoaded } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    Promise.all([
      apiFetchAdmin("/admin/metrics"),
      apiFetchAdmin("/admin/users?limit=20"),
    ])
      .then(([m, u]: any[]) => {
        setMetrics(m);
        setUsers(u.users ?? []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [isLoaded]);

  async function apiFetchAdmin(path: string) {
    const { apiFetch } = await import("@/lib/api");
    return (apiFetch as any)(path);
  }

  if (loading) return <div className="p-8 text-gray-400">Loading admin metrics...</div>;
  if (error) return (
    <div className="p-8 flex items-center gap-3 text-red-400">
      <AlertCircle className="w-5 h-5" />
      {error}
    </div>
  );

  const statCards = [
    { label: "Total Users",     value: metrics?.total_users ?? 0,   sub: `+${metrics?.new_users_30d ?? 0} this month`,  icon: <Users className="w-5 h-5" />,      color: "text-blue-400" },
    { label: "MRR",             value: `£${((metrics?.mrr ?? 0) / 100).toFixed(0)}`,   sub: `ARR £${((metrics?.arr ?? 0) / 100).toFixed(0)}`,    icon: <DollarSign className="w-5 h-5" />, color: "text-green-400" },
    { label: "Reports (all)",   value: metrics?.total_reports ?? 0, sub: `${metrics?.reports_30d ?? 0} this month`,      icon: <FileText className="w-5 h-5" />,    color: "text-violet-400" },
    { label: "AI Cost (30d)",   value: `$${metrics?.ai_cost_30d?.toFixed(2) ?? "0.00"}`, sub: `Total $${metrics?.total_ai_cost_usd?.toFixed(2) ?? "0.00"}`, icon: <Zap className="w-5 h-5" />, color: "text-amber-400" },
  ];

  return (
    <div className="p-8 max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-1">Platform health and user metrics</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{s.label}</span>
              <span className={s.color}>{s.icon}</span>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Plan distribution */}
      {metrics?.plan_distribution && (
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-gray-400" />
            Plan Distribution
          </h2>
          <div className="space-y-3">
            {Object.entries(metrics.plan_distribution).map(([plan, count]) => {
              const total = Object.values(metrics.plan_distribution).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={plan} className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium w-16 text-center ${PLAN_BADGE[plan] ?? "bg-gray-700 text-gray-300"}`}>
                    {plan}
                  </span>
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-300 w-8 text-right">{count}</span>
                  <span className="text-xs text-gray-500 w-8">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            Recent Users
          </h2>
          <input
            className="input text-sm w-48"
            placeholder="Search email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left p-4 font-medium">User</th>
                <th className="text-left p-4 font-medium">Plan</th>
                <th className="text-left p-4 font-medium">Reports</th>
                <th className="text-left p-4 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users
                .filter(u => !search || u.email.toLowerCase().includes(search.toLowerCase()))
                .map(u => (
                  <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="p-4">
                      <p className="text-white font-medium">{u.full_name || "—"}</p>
                      <p className="text-gray-400 text-xs">{u.email}</p>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${PLAN_BADGE[u.plan_tier] ?? "bg-gray-700 text-gray-300"}`}>
                        {u.plan_tier}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">{u.reports_used}</td>
                    <td className="p-4 text-gray-400">
                      {new Date(u.created_at).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
