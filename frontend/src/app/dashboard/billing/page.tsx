"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import {
  CreditCard, Zap, Star, Building2, Check, ArrowRight, AlertCircle
} from "lucide-react";

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Zap className="w-5 h-5" />,
  starter: <Star className="w-5 h-5" />,
  pro: <CreditCard className="w-5 h-5" />,
  agency: <Building2 className="w-5 h-5" />,
};

const PLAN_COLORS: Record<string, string> = {
  free: "border-gray-700",
  starter: "border-blue-600",
  pro: "border-violet-600",
  agency: "border-amber-500",
};

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  reports_per_month: number | null;
  features: string[];
  highlight: boolean;
  stripe_price_id: string | null;
}

interface Subscription {
  plan_tier: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  reports_used: number;
  reports_limit: number | null;
}

export default function BillingPage() {
  const { isLoaded } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    Promise.all([api.billing.plans(), api.billing.subscription()])
      .then(([p, s]) => {
        setPlans((p as any).plans ?? []);
        setSub(s as Subscription);
      })
      .finally(() => setLoading(false));
  }, [isLoaded]);

  async function handleUpgrade(planId: string) {
    if (planId === "free") return;
    setUpgrading(planId);
    try {
      const res = await api.billing.checkout(planId) as any;
      window.location.href = res.checkout_url;
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUpgrading(null);
    }
  }

  async function handlePortal() {
    try {
      const res = await api.billing.portal() as any;
      window.location.href = res.portal_url;
    } catch (e: any) {
      alert(e.message);
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 rounded-xl bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const currentPlan = sub?.plan_tier ?? "free";

  return (
    <div className="p-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-gray-400 mt-1">Manage your subscription and usage</p>
      </div>

      {/* Current usage */}
      {sub && (
        <div className="card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Current plan</p>
            <p className="text-xl font-bold text-white capitalize mt-1">{currentPlan}</p>
            {sub.current_period_end && (
              <p className="text-xs text-gray-500 mt-1">
                {sub.cancel_at_period_end ? "Cancels" : "Renews"}{" "}
                {new Date(sub.current_period_end).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric"
                })}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Reports used</p>
            <p className="text-2xl font-bold text-white mt-1">
              {sub.reports_used}
              <span className="text-gray-500 text-base font-normal">
                /{sub.reports_limit ?? "∞"}
              </span>
            </p>
          </div>
          {currentPlan !== "free" && (
            <button
              onClick={handlePortal}
              className="btn-outline text-sm"
            >
              Manage subscription
            </button>
          )}
        </div>
      )}

      {sub?.cancel_at_period_end && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-900/20 border border-amber-700 text-amber-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Your subscription will cancel at the end of the current billing period.
          <button onClick={handlePortal} className="underline ml-auto shrink-0">Reactivate</button>
        </div>
      )}

      {/* Plan cards */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isDowngrade = ["free", "starter", "pro", "agency"].indexOf(plan.id) <
              ["free", "starter", "pro", "agency"].indexOf(currentPlan);
            return (
              <div
                key={plan.id}
                className={`card p-5 flex flex-col gap-4 border-2 transition-all ${
                  isCurrent ? PLAN_COLORS[plan.id] : "border-transparent"
                } ${plan.highlight && !isCurrent ? "ring-1 ring-blue-500/50" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <span className={isCurrent ? "text-blue-400" : "text-gray-400"}>
                    {PLAN_ICONS[plan.id]}
                  </span>
                  <span className="font-semibold text-white capitalize">{plan.name}</span>
                  {isCurrent && (
                    <span className="ml-auto text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </div>

                <div>
                  {plan.price === 0 ? (
                    <span className="text-2xl font-bold text-white">Free</span>
                  ) : (
                    <div>
                      <span className="text-2xl font-bold text-white">
                        £{plan.price}
                      </span>
                      <span className="text-gray-400 text-sm">/{plan.interval}</span>
                    </div>
                  )}
                </div>

                <ul className="space-y-2 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {!isCurrent && plan.id !== "free" && !isDowngrade && (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={upgrading === plan.id}
                    className="btn-primary text-sm w-full flex items-center justify-center gap-2"
                  >
                    {upgrading === plan.id ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Upgrade <ArrowRight className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                )}
                {isDowngrade && !isCurrent && (
                  <button onClick={handlePortal} className="btn-outline text-sm w-full">
                    Downgrade via portal
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
