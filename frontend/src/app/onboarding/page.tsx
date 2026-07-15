"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

const TRADES = [
  { value: "plumber",     label: "🔧 Plumber" },
  { value: "electrician", label: "⚡ Electrician" },
  { value: "roofer",      label: "🏠 Roofer" },
  { value: "builder",     label: "🧱 Builder" },
  { value: "landscaper",  label: "🌿 Landscaper" },
  { value: "cleaner",     label: "🧹 Cleaner" },
  { value: "hvac",        label: "❄️ HVAC" },
  { value: "other",       label: "⚙️ Other" },
];

const STEPS = [
  { id: 1, label: "Business", desc: "What's your business called?" },
  { id: 2, label: "Trade",    desc: "What do you do?" },
  { id: 3, label: "Area",     desc: "Where do you work?" },
  { id: 4, label: "Website",  desc: "Got a website?" },
  { id: 5, label: "Details",  desc: "A few more details" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    business_name: "", service_type: "", service_area: "",
    website_url: "", phone: "", description: "",
    years_trading: "", team_size: "", avg_job_value: "",
  });

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  function canAdvance() {
    if (step === 1) return form.business_name.trim().length > 0;
    if (step === 2) return form.service_type.length > 0;
    if (step === 3) return form.service_area.trim().length > 0;
    return true;
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await api.generations.create({
        business_name: form.business_name,
        service_type: form.service_type,
        service_area: form.service_area,
        website_url: form.website_url || undefined,
        phone: form.phone || undefined,
        description: form.description || undefined,
        years_trading: form.years_trading ? parseInt(form.years_trading) : undefined,
        team_size: form.team_size ? parseInt(form.team_size) : undefined,
        avg_job_value: form.avg_job_value ? parseFloat(form.avg_job_value) : undefined,
        is_demo: false,
      }) as any;
      router.push("/results/" + res.id);
    } catch (e: any) {
      if (e.status === 429) router.push("/dashboard/billing?reason=limit");
      else { setError(e.message || "Something went wrong"); setGenerating(false); }
    }
  }

  const progress = Math.round((step / STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-8">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-zinc-400">Step {step} of {STEPS.length}</span>
            <span className="text-sm text-zinc-600">{progress}%</span>
          </div>
          <div className="h-1.5 bg-[#27272a] rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map(s => (
              <span key={s.id} className={`text-xs ${step >= s.id ? "text-blue-400" : "text-zinc-700"}`}>{s.label}</span>
            ))}
          </div>
        </div>

        <div className="card p-8 space-y-6">
          <div>
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-1">{STEPS[step-1].label}</p>
            <h2 className="text-2xl font-bold text-white">{STEPS[step-1].desc}</h2>
          </div>
          {error && <div className="p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm">{error}</div>}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="label">Business name *</label>
                <input className="input mt-1" placeholder="e.g. Smith's Plumbing" value={form.business_name} onChange={e => update("business_name", e.target.value)} autoFocus />
              </div>
              <div>
                <label className="label">Phone number (optional)</label>
                <input className="input mt-1" placeholder="07700 000000" value={form.phone} onChange={e => update("phone", e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-3">
              {TRADES.map(t => (
                <button key={t.value} onClick={() => update("service_type", t.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${form.service_type === t.value ? "border-blue-500 bg-blue-600/10 text-white" : "border-[#27272a] bg-[#18181f] text-zinc-400 hover:border-[#3f3f46]"}`}>
                  <span className="font-medium text-sm">{t.label}</span>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div>
              <label className="label">Town, city, or area *</label>
              <input className="input mt-1" placeholder="e.g. Manchester, Birmingham" value={form.service_area} onChange={e => update("service_area", e.target.value)} autoFocus />
              <p className="text-xs text-zinc-600 mt-2">Be specific — &quot;North Manchester&quot; beats &quot;UK&quot;</p>
            </div>
          )}

          {step === 4 && (
            <div>
              <label className="label">Website URL (optional)</label>
              <input className="input mt-1" placeholder="https://yourwebsite.co.uk" value={form.website_url} onChange={e => update("website_url", e.target.value)} autoFocus />
              <p className="text-xs text-zinc-600 mt-2">No website? No problem — we&apos;ll cover it.</p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <label className="label">About your business (optional)</label>
                <textarea className="input mt-1 h-24 resize-none" placeholder="Emergency plumbing, bathroom fitting, boiler repairs..." value={form.description} onChange={e => update("description", e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Years trading</label>
                  <input className="input mt-1" type="number" min="0" placeholder="8" value={form.years_trading} onChange={e => update("years_trading", e.target.value)} />
                </div>
                <div>
                  <label className="label">Team size</label>
                  <input className="input mt-1" type="number" min="1" placeholder="3" value={form.team_size} onChange={e => update("team_size", e.target.value)} />
                </div>
                <div>
                  <label className="label">Avg job £</label>
                  <input className="input mt-1" type="number" min="0" placeholder="350" value={form.avg_job_value} onChange={e => update("avg_job_value", e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {step > 1 && <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>}
          <div className="flex-1" />
          {step < 5
            ? <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()} className="btn-primary flex items-center gap-2">Next <ArrowRight className="w-4 h-4" /></button>
            : <button onClick={generate} disabled={generating} className="btn-primary flex items-center gap-2 px-6">
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><CheckCircle2 className="w-4 h-4" /> Generate My Growth Package</>}
              </button>
          }
        </div>
      </div>
    </div>
  );
}
