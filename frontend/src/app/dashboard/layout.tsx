"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard, Settings, CreditCard, Menu, X,
  Zap, ChevronRight, Plus
} from "lucide-react";

const NAV = [
  { href: "/dashboard",          label: "Dashboard",   icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/dashboard/billing",  label: "Billing",     icon: <CreditCard className="w-4 h-4" /> },
  { href: "/dashboard/settings", label: "Settings",    icon: <Settings className="w-4 h-4" /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const Sidebar = () => (
    <aside className="w-56 shrink-0 border-r border-[#27272a] bg-[#0a0a0f] flex flex-col h-full">
      <div className="p-5 border-b border-[#27272a]">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-blue-400">LeadForge</span>
          <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold">AI</span>
        </Link>
      </div>

      <div className="p-3 border-b border-[#27272a]">
        <Link href="/onboarding" className="flex items-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-2.5 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          New Growth Package
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(n => {
          const active = pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href));
          return (
            <Link key={n.href} href={n.href}
              className={active ? "sidebar-link-active" : "sidebar-link"}>
              {n.icon}
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#27272a]">
        <Link href="/demo" className="sidebar-link text-xs">
          <Zap className="w-3.5 h-3.5" /> Try Demo Mode
        </Link>
        <div className="mt-3 px-3">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-56 flex flex-col">
            <Sidebar />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-[#27272a]">
          <button onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5 text-zinc-400" />
          </button>
          <span className="font-bold text-blue-400 text-sm">LeadForge AI</span>
          <UserButton afterSignOutUrl="/" />
        </div>
        {children}
      </main>
    </div>
  );
}
