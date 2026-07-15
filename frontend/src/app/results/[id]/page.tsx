"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, APIError } from "@/lib/api";
import Link from "next/link";
import {
  Target, MessageSquare, MapPin, Sparkles, Calendar,
  Copy, Check, ChevronDown, ChevronUp, ArrowRight,
  AlertCircle, RefreshCw, Loader2, TrendingUp, Zap
} from "lucide-react";

type Tab = "leads" | "quotes" | "gbp" | "content" | "plan";

const TABS: { id: Tab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "leads",   label: "Lead Opportunities",  icon: <Target className="w-4 h-4" />,      color: "text-blue-400" },
  { id: "quotes",  label: "Quote Follow-Up",      icon: <MessageSquare className="w-4 h-4" />, color: "text-violet-400" },
  { id: "gbp",     label: "Google Business",      icon: <MapPin className="w-4 h-4" />,       color: "text-green-400" },
  { id: "content", label: "Content Quick-Wins",   icon: <Sparkles className="w-4 h-4" />,     color: "text-amber-400" },
  { id: "plan",    label: "90-Day Plan",           icon: <Calendar className="w-4 h-4" />,     color: "text-pink-400" },
];

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#27272a" strokeWidth="6" />
        <circle
          cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ * 0.25} className="score-ring"
          style={{ transform: "rotate(-90deg)", transformOrigin: "48px 48px" }}
        />
        <text x="48" y="53" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">{score}</text>
      </svg>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="copy-btn shrink-0">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ── Module: Leads ──────────────────────────────────────────────────────────

function LeadsModule({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-6 fade-up">
      {/* This week actions */}
      <div className="card p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400" />
          What to do this week
        </h3>
        <div className="space-y-3">
          {(data.this_week_actions || []).map((a: any, i: number) => (
            <div key={i} className="flex gap-4 p-4 bg-[#18181f] rounded-lg group">
              <span className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {a.priority || i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">{a.action}</p>
                <p className="text-zinc-500 text-xs mt-1">{a.why}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-zinc-600">⏱ {a.time_needed}</span>
                  <span className="text-xs text-green-400">{a.expected_impact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Keywords */}
      <div className="card p-6">
        <h3 className="font-semibold text-white mb-4">Top Keywords to Target</h3>
        <div className="space-y-2">
          {(data.top_keywords || []).map((kw: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 bg-[#18181f] rounded-lg group">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{kw.keyword}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{kw.opportunity}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="text-xs text-zinc-400">{kw.monthly_searches?.toLocaleString()}/mo</span>
                <span className={`badge text-xs ${
                  kw.difficulty === "Low" ? "badge-green" : kw.difficulty === "Medium" ? "badge-amber" : "badge-red"
                }`}>{kw.difficulty}</span>
                <CopyButton text={kw.keyword} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick wins */}
      <div className="card p-6">
        <h3 className="font-semibold text-white mb-4">48-Hour Quick Wins</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(data.quick_wins || []).map((w: any, i: number) => (
            <div key={i} className="p-4 bg-[#18181f] rounded-lg">
              <p className="text-sm text-white mb-2">{w.win}</p>
              <p className="text-xs text-zinc-400 mb-2">{w.do_it_today}</p>
              <div className="flex gap-2">
                <span className={`badge text-xs ${w.effort === "Low" ? "badge-green" : "badge-amber"}`}>
                  {w.effort} effort
                </span>
                <span className={`badge text-xs ${w.impact === "High" ? "badge-blue" : "badge-gray"}`}>
                  {w.impact} impact
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Competitor gaps */}
      {(data.competitor_gaps || []).length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-white mb-4">Competitor Gaps You Can Exploit</h3>
          <div className="space-y-3">
            {(data.competitor_gaps || []).map((g: any, i: number) => (
              <div key={i} className="p-4 bg-[#18181f] rounded-lg">
                <p className="text-sm font-medium text-amber-400 mb-1">{g.gap}</p>
                <p className="text-sm text-zinc-300 mb-2">{g.opportunity}</p>
                <p className="text-xs text-zinc-500">{g.how_to_exploit}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Module: Quotes ─────────────────────────────────────────────────────────

function QuotesModule({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-6 fade-up">
      {/* SMS follow-up */}
      <div className="card p-6">
        <h3 className="font-semibold text-white mb-1">SMS Follow-Up Sequence</h3>
        <p className="text-xs text-zinc-500 mb-4">Copy and paste. Send via WhatsApp or SMS.</p>
        <div className="space-y-3">
          {(data.sms_followup || []).map((sms: any, i: number) => (
            <div key={i} className="p-4 bg-[#18181f] rounded-lg group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <span className="badge badge-blue text-xs mb-2">{sms.timing}</span>
                  <p className="text-sm text-white mt-2 leading-relaxed">{sms.message}</p>
                  <p className="text-xs text-zinc-500 mt-1">{sms.purpose}</p>
                </div>
                <CopyButton text={sms.message} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email sequence */}
      <div className="card p-6">
        <h3 className="font-semibold text-white mb-4">Email Follow-Up Sequence</h3>
        <div className="space-y-3">
          {(data.email_sequence || []).map((email: any, i: number) => (
            <div key={i} className="p-4 bg-[#18181f] rounded-lg group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge badge-violet text-xs">Day {email.day}</span>
                    <span className="text-xs text-zinc-400 font-medium">{email.subject}</span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{email.body}</p>
                  <p className="text-xs text-blue-400 mt-2">{email.cta}</p>
                </div>
                <CopyButton text={`Subject: ${email.subject}\n\n${email.body}\n\n${email.cta}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review requests */}
      <div className="card p-6">
        <h3 className="font-semibold text-white mb-4">Review Request Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(data.review_requests || []).map((r: any, i: number) => (
            <div key={i} className="p-4 bg-[#18181f] rounded-lg group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="badge badge-amber text-xs">{r.platform}</span>
                  <span className="text-xs text-zinc-500">{r.channel}</span>
                </div>
                <CopyButton text={r.message} />
              </div>
              <p className="text-xs text-zinc-500 mb-2">{r.timing}</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{r.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Missed quote recovery */}
      {(data.missed_quote_recovery || []).length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-white mb-1">Missed Quote Recovery</h3>
          <p className="text-xs text-zinc-500 mb-4">For quotes that went cold (2+ weeks ago)</p>
          <div className="space-y-3">
            {(data.missed_quote_recovery || []).map((m: any, i: number) => (
              <div key={i} className="p-4 bg-[#18181f] rounded-lg group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex gap-2 mb-2">
                      <span className="badge badge-gray text-xs">{m.timing}</span>
                      <span className="badge badge-gray text-xs">{m.channel}</span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{m.message}</p>
                  </div>
                  <CopyButton text={m.message} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Module: GBP ────────────────────────────────────────────────────────────

function GBPModule({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-6 fade-up">
      {data.priority_fix && (
        <div className="p-4 rounded-xl bg-amber-900/15 border border-amber-700/40 text-amber-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Priority Fix: </span>{data.priority_fix}
          </div>
        </div>
      )}

      <div className="card p-6">
        <h3 className="font-semibold text-white mb-4">Profile Checklist</h3>
        <div className="space-y-2">
          {(data.profile_checklist || []).map((item: any, i: number) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-[#18181f] rounded-lg">
              <span className={`badge text-xs mt-0.5 shrink-0 ${
                item.status === "Missing" ? "badge-red" : item.status === "Incomplete" ? "badge-amber" : "badge-green"
              }`}>{item.status}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{item.item}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{item.action}</p>
              </div>
              <span className={`badge text-xs shrink-0 ${
                item.impact === "High" ? "badge-blue" : item.impact === "Medium" ? "badge-violet" : "badge-gray"
              }`}>{item.impact}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-white mb-1">4 Weeks of GBP Posts</h3>
        <p className="text-xs text-zinc-500 mb-4">Copy and post directly to Google Business Profile</p>
        <div className="space-y-3">
          {(data.weekly_posts || []).map((post: any, i: number) => (
            <div key={i} className="p-4 bg-[#18181f] rounded-lg group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge badge-green text-xs">Week {post.week}</span>
                    <span className="text-xs text-zinc-400">{post.post_type}</span>
                  </div>
                  <p className="text-sm font-medium text-white mb-1">{post.title}</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{post.content}</p>
                  {post.call_to_action && (
                    <p className="text-xs text-blue-400 mt-2">CTA: {post.call_to_action}</p>
                  )}
                </div>
                <CopyButton text={`${post.title}\n\n${post.content}\n\n${post.call_to_action || ""}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-white mb-4">Review Response Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(data.review_response_templates || []).map((t: any, i: number) => (
            <div key={i} className="p-4 bg-[#18181f] rounded-lg group">
              <div className="flex items-center justify-between mb-2">
                <span className="badge badge-gray text-xs">{t.type.replace(/_/g, " ")}</span>
                <CopyButton text={t.template} />
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">{t.template}</p>
            </div>
          ))}
        </div>
      </div>

      {(data.local_ranking_opportunities || []).length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-white mb-4">Local Ranking Opportunities</h3>
          <div className="space-y-3">
            {(data.local_ranking_opportunities || []).map((opp: any, i: number) => (
              <div key={i} className="p-3 bg-[#18181f] rounded-lg">
                <p className="text-sm font-medium text-white">{opp.keyword}</p>
                <p className="text-xs text-zinc-400 mt-1">{opp.current_opportunity}</p>
                <p className="text-xs text-blue-400 mt-1">→ {opp.action}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Module: Content Quick-Wins ─────────────────────────────────────────────

function ContentModule({ data }: { data: any }) {
  const [section, setSection] = useState<"facebook" | "gbp" | "reviews" | "seasonal">("facebook");
  if (!data) return null;

  const sections = [
    { id: "facebook" as const,  label: "Facebook Posts (10)", count: data.facebook_posts?.length },
    { id: "gbp" as const,       label: "GBP Posts (10)",      count: data.google_business_posts?.length },
    { id: "reviews" as const,   label: "Review Requests (10)", count: data.review_request_messages?.length },
    { id: "seasonal" as const,  label: "Promotions (10)",     count: data.seasonal_promotions?.length },
  ];

  return (
    <div className="space-y-4 fade-up">
      <div className="flex flex-wrap gap-2">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              section === s.id ? "bg-blue-600 text-white" : "bg-[#111118] text-zinc-400 hover:text-white border border-[#27272a]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "facebook" && (
        <div className="space-y-3">
          {(data.facebook_posts || []).map((p: any, i: number) => (
            <div key={i} className="card p-5 group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-white leading-relaxed">{p.post}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
                    {p.best_time && <span>📅 {p.best_time}</span>}
                    {p.image_suggestion && <span>📸 {p.image_suggestion}</span>}
                  </div>
                </div>
                <CopyButton text={p.post} />
              </div>
            </div>
          ))}
        </div>
      )}

      {section === "gbp" && (
        <div className="space-y-3">
          {(data.google_business_posts || []).map((p: any, i: number) => (
            <div key={i} className="card p-5 group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white mb-1">{p.title}</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{p.content}</p>
                  {p.offer && <p className="text-xs text-green-400 mt-2">Offer: {p.offer}</p>}
                </div>
                <CopyButton text={`${p.title}\n\n${p.content}${p.offer ? `\n\n${p.offer}` : ""}`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {section === "reviews" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(data.review_request_messages || []).map((r: any, i: number) => (
            <div key={i} className="card p-5 group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <span className="badge badge-amber text-xs mb-2">{r.platform}</span>
                  <p className="text-sm text-zinc-300 leading-relaxed mt-2">{r.message}</p>
                </div>
                <CopyButton text={r.message} />
              </div>
            </div>
          ))}
        </div>
      )}

      {section === "seasonal" && (
        <div className="space-y-3">
          {(data.seasonal_promotions || []).map((p: any, i: number) => (
            <div key={i} className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge badge-amber text-xs">{p.season}</span>
                {p.offer && <span className="text-xs text-zinc-400">{p.offer}</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-[#18181f] p-3 rounded-lg group">
                  <p className="text-xs text-zinc-500 mb-1">Facebook / GBP</p>
                  <p className="text-sm text-zinc-300">{p.post}</p>
                  <CopyButton text={p.post} />
                </div>
                {p.sms && (
                  <div className="bg-[#18181f] p-3 rounded-lg group">
                    <p className="text-xs text-zinc-500 mb-1">SMS</p>
                    <p className="text-sm text-zinc-300">{p.sms}</p>
                    <CopyButton text={p.sms} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Module: Revenue Plan ───────────────────────────────────────────────────

function PlanModule({ data }: { data: any }) {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  if (!data) return null;

  return (
    <div className="space-y-6 fade-up">
      {data.biggest_opportunity && (
        <div className="p-5 rounded-xl bg-blue-900/15 border border-blue-600/30">
          <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-2">Biggest Opportunity</p>
          <p className="text-white font-medium">{data.biggest_opportunity}</p>
        </div>
      )}

      {/* Month themes */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Month 1", value: data.month_1_focus },
          { label: "Month 2", value: data.month_2_focus },
          { label: "Month 3", value: data.month_3_focus },
        ].map(m => m.value && (
          <div key={m.label} className="card p-4">
            <p className="text-xs text-zinc-500 mb-1">{m.label}</p>
            <p className="text-sm text-white">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue projections */}
      {data.revenue_projections && (
        <div className="card p-6">
          <h3 className="font-semibold text-white mb-4">Revenue Projections</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-zinc-500">Month 1 leads</p>
              <p className="text-xl font-bold text-white">{data.revenue_projections.month_1_leads}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Month 3 leads</p>
              <p className="text-xl font-bold text-white">{data.revenue_projections.month_3_leads}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Month 3 revenue</p>
              <p className="text-xl font-bold text-green-400">£{(data.revenue_projections.month_3_revenue || 0).toLocaleString()}</p>
            </div>
          </div>
          {(data.revenue_projections.assumptions || []).length > 0 && (
            <div className="mt-4 text-xs text-zinc-600 space-y-1">
              {data.revenue_projections.assumptions.map((a: string, i: number) => (
                <p key={i}>* {a}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Weekly plan */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-[#27272a]">
          <h3 className="font-semibold text-white">12-Week Action Plan</h3>
        </div>
        <div className="divide-y divide-[#27272a]">
          {(data.weekly_plan || []).map((week: any) => (
            <div key={week.week}>
              <button
                onClick={() => setExpandedWeek(expandedWeek === week.week ? null : week.week)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#18181f] transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="badge badge-gray text-xs shrink-0">Week {week.week}</span>
                  <span className="text-sm font-medium text-white">{week.theme}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-zinc-500">{week.success_metric}</span>
                  {expandedWeek === week.week
                    ? <ChevronUp className="w-4 h-4 text-zinc-500" />
                    : <ChevronDown className="w-4 h-4 text-zinc-500" />
                  }
                </div>
              </button>
              {expandedWeek === week.week && (
                <div className="px-4 pb-4 space-y-2">
                  {(week.tasks || []).map((task: any, ti: number) => (
                    <div key={ti} className="flex items-start gap-3 p-3 bg-[#18181f] rounded-lg">
                      <div className="w-5 h-5 rounded border border-zinc-700 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{task.task}</p>
                        <p className="text-xs text-zinc-500 mt-1">{task.time_needed} · {task.customer_impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Daily habits */}
      {(data.daily_habits || []).length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-white mb-4">Daily Habits (Do Every Day)</h3>
          <div className="space-y-2">
            {data.daily_habits.map((h: string, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded border border-zinc-700 shrink-0" />
                <span className="text-zinc-300">{h}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Results Page ──────────────────────────────────────────────────────

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "generating" | "done" | "failed">("loading");
  const [genData, setGenData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>("leads");
  const [loadingMsg, setLoadingMsg] = useState("Generating your growth package...");
  const [tabData, setTabData] = useState<Record<Tab, any>>({
    leads: null, quotes: null, gbp: null, content: null, plan: null,
  });

  const pollStatus = useCallback(async () => {
    try {
      const s = await api.generations.status(id);
      if (s.message) setLoadingMsg(s.message);
      if (s.status === "completed") {
        const full = await api.generations.get(id);
        setGenData(full);
        setTabData({
          leads: full.leads,
          quotes: full.quotes,
          gbp: full.gbp,
          content: full.content,
          plan: full.plan,
        });
        setStatus("done");
      } else if (s.status === "failed") {
        setStatus("failed");
      } else {
        setStatus("generating");
      }
    } catch {
      setStatus("failed");
    }
  }, [id]);

  useEffect(() => {
    pollStatus();
    const interval = setInterval(pollStatus, 2500);
    return () => clearInterval(interval);
  }, [pollStatus]);

  useEffect(() => {
    if (status === "done") return;
    // Stop polling once done
  }, [status]);

  if (status === "loading" || status === "generating") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
          <p className="text-white font-medium">{loadingMsg}</p>
          <p className="text-zinc-500 text-sm">This takes about 45–60 seconds</p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Generation failed</h2>
          <p className="text-zinc-400 text-sm">Something went wrong. Please try again.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push("/demo")} className="btn-primary flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="border-b border-[#27272a] bg-[#0a0a0f] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-bold">LeadForge AI</span>
              {genData?.is_demo && <span className="badge badge-amber text-xs">Demo</span>}
            </div>
            <p className="text-sm text-zinc-400">
              {genData?.business_name} · {genData?.service_area}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Scores */}
            {genData?.lead_score > 0 && (
              <div className="hidden md:flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-400">{genData.lead_score}</p>
                  <p className="text-xs text-zinc-600">Lead score</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-400">{genData.gbp_score}</p>
                  <p className="text-xs text-zinc-600">GBP score</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-violet-400">{genData.revenue_score}</p>
                  <p className="text-xs text-zinc-600">Revenue score</p>
                </div>
              </div>
            )}
            {genData?.is_demo && (
              <Link href="/sign-up" className="btn-primary text-sm flex items-center gap-2">
                Save & Get Full Access <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-6 flex gap-1 overflow-x-auto pb-px">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t.id
                  ? `border-blue-500 ${t.color}`
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === "leads"   && <LeadsModule data={tabData.leads} />}
        {activeTab === "quotes"  && <QuotesModule data={tabData.quotes} />}
        {activeTab === "gbp"     && <GBPModule data={tabData.gbp} />}
        {activeTab === "content" && <ContentModule data={tabData.content} />}
        {activeTab === "plan"    && <PlanModule data={tabData.plan} />}
      </div>

      {/* Demo upgrade banner */}
      {genData?.is_demo && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-blue-600 text-white rounded-xl px-6 py-3 flex items-center gap-4 shadow-2xl">
            <span className="text-sm font-medium">Ready to use this for your own business?</span>
            <Link href="/sign-up" className="bg-white text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1">
              Start Free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
