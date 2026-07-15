import Link from "next/link";
import { ArrowRight, Zap, Users, TrendingUp, CheckCircle2, Star } from "lucide-react";

const TRADES = ["Plumbers", "Electricians", "Roofers", "Builders", "Landscapers", "HVAC", "Cleaners"];

const FEATURES = [
  {
    icon: "🎯",
    title: "Lead Opportunity Engine",
    desc: "Discover your top local keywords, competitor gaps, and the 5 actions to take this week.",
  },
  {
    icon: "💬",
    title: "Quote Follow-Up System",
    desc: "SMS and email sequences that convert more enquiries into paid jobs. Copy, paste, send.",
  },
  {
    icon: "📍",
    title: "Google Business Optimizer",
    desc: "Rank higher in local search. Get a full profile checklist + 4 weeks of ready-made GBP posts.",
  },
  {
    icon: "✍️",
    title: "40 Pieces of Content",
    desc: "Facebook posts, GBP posts, review requests, and seasonal promotions — all written for your trade.",
  },
  {
    icon: "📅",
    title: "90-Day Revenue Plan",
    desc: "Week-by-week tasks. Every single one answers: what gets me more customers?",
  },
  {
    icon: "⚡",
    title: "Under 60 Seconds",
    desc: "Enter your details. AI does the rest. Full growth package in under a minute.",
  },
];

const TESTIMONIALS = [
  {
    name: "Mike D.",
    trade: "Plumber, Manchester",
    quote: "Got 4 new enquiries in the first week just from fixing my Google profile.",
    score: 5,
  },
  {
    name: "Sarah T.",
    trade: "Electrician, Birmingham",
    quote: "The follow-up messages alone paid for the subscription 10 times over.",
    score: 5,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#27272a] bg-[#0a0a0f]/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-400">LeadForge</span>
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-semibold">AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/demo" className="text-sm text-zinc-400 hover:text-white transition-colors font-medium">
              Try Demo
            </Link>
            <Link href="/sign-in" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/demo" className="btn-primary text-sm">
              Get More Customers →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-6">
          <Zap className="w-3.5 h-3.5" />
          AI-powered local customer acquisition — ready in 60 seconds
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          Get More Local<br />
          <span className="text-blue-400">Customers.</span>
        </h1>
        <p className="text-xl text-zinc-400 mb-4 max-w-2xl mx-auto">
          Enter your trade and area. Get your complete customer acquisition system — 
          keywords, follow-up messages, GBP optimisation, content, and a 90-day plan.
        </p>
        <p className="text-zinc-500 mb-10 text-sm">
          No marketing agency. No 3-month wait. No jargon. Just customers.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/demo" className="btn-primary text-base px-8 py-3 flex items-center gap-2">
            Run Free Demo <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/sign-up" className="btn-outline text-base px-6 py-3">
            Start Free — No Card Required
          </Link>
        </div>
        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-zinc-500">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" />No signup for demo</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" />Results in 60 seconds</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" />Cancel anytime</span>
        </div>
      </section>

      {/* Trade pills */}
      <div className="overflow-hidden py-4 border-y border-[#27272a] mb-20">
        <div className="flex gap-4 px-6 justify-center flex-wrap">
          {TRADES.map(t => (
            <span key={t} className="text-sm text-zinc-500 bg-[#111118] border border-[#27272a] rounded-full px-4 py-1.5">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Everything you need. Nothing you don't.</h2>
          <p className="text-zinc-400">Five modules. One goal: more paying customers.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="card p-6 hover:border-[#3f3f46] transition-colors">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 pb-24 max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="card p-6">
              <div className="flex gap-0.5 mb-3">
                {[...Array(t.score)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed mb-4">"{t.quote}"</p>
              <div>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-zinc-500">{t.trade}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 text-center">
        <div className="max-w-xl mx-auto card p-10">
          <h2 className="text-2xl font-bold mb-3">See it work on your business</h2>
          <p className="text-zinc-400 text-sm mb-6">Try the demo. No signup. Takes 60 seconds.</p>
          <Link href="/demo" className="btn-primary px-8 py-3 text-base inline-flex items-center gap-2">
            Run Free Demo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#27272a] px-6 py-8 text-center text-sm text-zinc-600">
        © {new Date().getFullYear()} LeadForge AI · Built for UK &amp; US tradespeople
      </footer>
    </div>
  );
}
