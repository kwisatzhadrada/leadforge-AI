"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import Link from "next/link";
import { TrendingUp, Target, MapPin, ArrowRight, Loader2, Plus, Zap } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  completed: "badge-green",
  generating: "badge-blue",
  pending: "badge-amber",
  failed: "badge-red",
};

export default function DashboardPage() {
  const { isLoaded } = useAuth();
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!isLoaded) return;
    Promise.all([api.generations.list(), api.users.me()])
      .then(([g, u]) => {
        setGenerations((g as any).generations ?? []);
        setUser(u);
      })
      .finally(() => setLoading(false));
  }, [isLoaded]);

  const completed = generations.filter(g => g.status === "completed");
  const avgLeadScore = completed.length
    ? Math.round(completed.reduce((a, g) => a + (g.lead_score || 0), 0) / completed.length)
    : null;

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-zinc-400">
      <Loader2 className="w-5 h-5 animate-spin" /> Loading...
    </div>
  );

  const planLimit: Record<string, number | null> = { free: 1, starter: 5, pro: 25, agency: null };
  const limit = planLimit[user?.plan_tier ?? "free"];
  const used = user?.generations_used ?? 0;

  return (
    <div className="p-8 max-w-5xl space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Growths generated</p>
          <p className="text-2xl font-bold text-white">{used}<span className="text-zinc-600 text-base font-normal">/{limit ?? "∞"}</span></p>
          {limit && (
            <div className="h-1.5 bg-[#27272a] rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((used/limit)*100, 100)}%` }} />
            </div>
          )}
        </div>
        <div className="card p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Avg lead score</p>
          <p className="text-2xl font-bold text-white">{avgLeadScore ?? "—"}<span className="text-zinc-600 text-base font-normal">/100</span></p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Plan</p>
          <p className="text-2xl font-bold text-white capitalize">{user?.plan_tier ?? "Free"}</p>
          {user?.plan_tier === "free" && (
            <Link href="/dashboard/billing" className="text-xs text-blue-400 hover:underline mt-1 block">Upgrade →</Link>
          )}
        </div>
      </div>

      {/* CTA */}
      <Link href="/onboarding"
        className="block card p-6 border-dashed border-blue-600/40 hover:border-blue-500 hover:bg-blue-600/5 transition-all group">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
            <Plus className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Get more customers</p>
            <p className="text-sm text-zinc-400">Generate a new growth package for your business</p>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 ml-auto transition-colors" />
        </div>
      </Link>

      {/* Upgrade prompt */}
      {user?.plan_tier === "free" && limit && used >= limit && (
        <div className="card p-5 border-amber-700/40 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-white">You've used your free generation</p>
            <p className="text-sm text-zinc-400">Upgrade to get 5, 25, or unlimited growth packages per month.</p>
          </div>
          <Link href="/dashboard/billing" className="btn-primary whitespace-nowrap text-sm">Upgrade Plan</Link>
        </div>
      )}

      {/* Recent generations */}
      <div>
        <h2 className="font-semibold text-white mb-4">Your Growth Packages</h2>
        {generations.length === 0 ? (
          <div className="card p-12 text-center">
            <Zap className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 mb-2">No growth packages yet</p>
            <Link href="/onboarding" className="btn-primary text-sm inline-flex items-center gap-2">
              Generate your first one <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {generations.map(g => (
              <Link key={g.id} href={`/results/${g.id}`}
                className="card-hover p-5 flex items-center justify-between gap-4 block">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#18181f] flex items-center justify-center shrink-0 text-lg">
                    {g.service_type === "plumber" ? "🔧" : g.service_type === "electrician" ? "⚡" : g.service_type === "roofer" ? "🏠" : "⚙️"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{g.business_name}</p>
                    <p className="text-xs text-zinc-500">{g.service_area} · {new Date(g.created_at).toLocaleDateString("en-GB")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {g.lead_score > 0 && (
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-blue-400">{g.lead_score}</p>
                      <p className="text-xs text-zinc-600">Lead score</p>
                    </div>
                  )}
                  <span className={`badge text-xs ${STATUS_BADGE[g.status] ?? "badge-gray"}`}>
                    {g.status}
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-600" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
