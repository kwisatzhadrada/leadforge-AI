"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Zap, ArrowRight, Loader2 } from "lucide-react";

const DEMO_BUSINESSES = [
  { label: "🔧 Emergency Plumber — Manchester", service_type: "plumber", service_area: "Manchester", business_name: "City Plumbing Solutions", description: "Emergency and residential plumbing. 15 years trading, 4-man team." },
  { label: "⚡ Electrician — Birmingham", service_type: "electrician", service_area: "Birmingham", business_name: "Spark Right Electrical", description: "Domestic and commercial electrical. Part P certified." },
  { label: "🏠 Roofer — Leeds", service_type: "roofer", service_area: "Leeds", business_name: "Summit Roofing Co", description: "Domestic roof repairs and full replacements." },
  { label: "🌿 Landscaper — London", service_type: "landscaper", service_area: "London", business_name: "Green Scene Gardens", description: "Garden design and maintenance for residential clients." },
];

type DemoStep = "pick" | "custom" | "loading";

export default function DemoPage() {
  const router = useRouter();
  const [step, setStep] = useState<DemoStep>("pick");
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState({ business_name: "", service_type: "plumber", service_area: "" });
  const [loadingMsg, setLoadingMsg] = useState("Starting...");
  const [error, setError] = useState<string | null>(null);

  const LOADING_STEPS = [
    "Analysing lead opportunities...",
    "Building quote follow-up system...",
    "Optimising Google Business Profile...",
    "Creating 40 pieces of content...",
    "Building 90-day revenue plan...",
    "Almost done...",
  ];

  async function startDemo(payload: object) {
    setStep("loading");
    setError(null);

    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, LOADING_STEPS.length - 1);
      setLoadingMsg(LOADING_STEPS[stepIdx]);
    }, 8000);

    try {
      const res = await api.generations.create({ ...payload, is_demo: true }) as any;
      const genId = res.id;

      // Poll for completion
      let attempts = 0;
      while (attempts < 120) {
        await new Promise(r => setTimeout(r, 2000));
        const status = await api.generations.status(genId) as any;
        if (status.message) setLoadingMsg(status.message);
        if (status.status === "completed") {
          clearInterval(interval);
          router.push(`/results/${genId}`);
          return;
        }
        if (status.status === "failed") {
          throw new Error(status.error_message || "Generation failed");
        }
        attempts++;
      }
      throw new Error("Generation timed out. Please try again.");
    } catch (e: any) {
      clearInterval(interval);
      setError(e.message || "Something went wrong. Please try again.");
      setStep("pick");
    }
  }

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-8">
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-4 border-blue-600/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div>
            <p className="text-white font-semibold text-lg mb-2">{loadingMsg}</p>
            <p className="text-zinc-500 text-sm">AI is generating your growth package</p>
          </div>
          <div className="space-y-2 text-left">
            {[
              "Lead opportunities",
              "Quote follow-up system",
              "GBP optimisation",
              "40 content pieces",
              "90-day plan",
            ].map((item, i) => (
              <div key={item} className="flex items-center gap-3 text-sm">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  LOADING_STEPS.indexOf(loadingMsg) > i
                    ? "bg-green-500 border-green-500"
                    : LOADING_STEPS.indexOf(loadingMsg) === i
                    ? "border-blue-500 animate-pulse"
                    : "border-zinc-700"
                }`}>
                  {LOADING_STEPS.indexOf(loadingMsg) > i && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={LOADING_STEPS.indexOf(loadingMsg) > i ? "text-zinc-400" : "text-zinc-600"}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-4">
            <Zap className="w-3.5 h-3.5" />
            Free demo — no signup required
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">See it in 60 seconds</h1>
          <p className="text-zinc-400">Pick a demo business or use your own details</p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm">
            {error}
          </div>
        )}

        {step === "pick" && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Choose a demo</p>
            {DEMO_BUSINESSES.map((biz, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selected === i
                    ? "border-blue-500 bg-blue-600/10"
                    : "border-[#27272a] bg-[#111118] hover:border-[#3f3f46]"
                }`}
              >
                <span className="font-medium text-white">{biz.label}</span>
              </button>
            ))}

            <button
              onClick={() => setStep("custom")}
              className="w-full text-left p-4 rounded-xl border border-dashed border-[#3f3f46] text-zinc-400 hover:border-blue-500 hover:text-blue-400 transition-all text-sm"
            >
              + Enter my own business details
            </button>

            <button
              onClick={() => selected !== null && startDemo(DEMO_BUSINESSES[selected])}
              disabled={selected === null}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              Run Demo <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === "custom" && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Your business</p>
            <div>
              <label className="label">Business name</label>
              <input
                className="input mt-1"
                placeholder="e.g. Smith's Plumbing"
                value={custom.business_name}
                onChange={e => setCustom(c => ({ ...c, business_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Trade</label>
              <select
                className="input mt-1"
                value={custom.service_type}
                onChange={e => setCustom(c => ({ ...c, service_type: e.target.value }))}
              >
                {["plumber","electrician","roofer","builder","landscaper","cleaner","hvac","other"].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Service area</label>
              <input
                className="input mt-1"
                placeholder="e.g. Manchester, Birmingham, Leeds"
                value={custom.service_area}
                onChange={e => setCustom(c => ({ ...c, service_area: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("pick")} className="btn-secondary flex-1 py-3">
                Back
              </button>
              <button
                onClick={() => startDemo(custom)}
                disabled={!custom.business_name || !custom.service_area}
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
              >
                Generate <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
