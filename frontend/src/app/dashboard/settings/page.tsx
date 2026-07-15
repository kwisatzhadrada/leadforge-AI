"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/lib/api";
import { User, Building2, Shield, Save } from "lucide-react";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [tab, setTab] = useState<"profile" | "security">("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "" });

  useEffect(() => {
    if (!isLoaded || !user) return;
    setForm({
      full_name: user.fullName ?? "",
      email: user.primaryEmailAddress?.emailAddress ?? "",
    });
  }, [isLoaded, user]);

  async function handleSave() {
    setSaving(true);
    try {
      await user?.update({ firstName: form.full_name.split(" ")[0], lastName: form.full_name.split(" ").slice(1).join(" ") });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account preferences</p>
      </div>

      <div className="flex gap-1 border-b border-gray-800">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-blue-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="card p-6 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white">
              {form.full_name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-semibold text-white">{form.full_name || "Your Name"}</p>
              <p className="text-sm text-gray-400">{form.email}</p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-5 space-y-4">
            <div>
              <label className="label">Full name</label>
              <input
                className="input mt-1"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Email address</label>
              <input
                className="input mt-1"
                value={form.email}
                disabled
                title="Email can be changed via your Clerk account"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email changes are managed via your authentication provider.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saved ? "Saved!" : "Save changes"}
            </button>
          </div>
        </div>
      )}

      {tab === "security" && (
        <div className="card p-6 space-y-5">
          <div>
            <h3 className="font-semibold text-white mb-1">Password</h3>
            <p className="text-sm text-gray-400">
              Password management is handled securely through Clerk. Use the Clerk user portal to update your password.
            </p>
            <a
              href="https://accounts.clerk.dev/user"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline text-sm mt-3 inline-flex"
            >
              Open account security settings ↗
            </a>
          </div>

          <div className="border-t border-gray-800 pt-5">
            <h3 className="font-semibold text-white mb-1">Sessions</h3>
            <p className="text-sm text-gray-400">
              You are currently signed in on this device.
            </p>
          </div>

          <div className="border-t border-gray-800 pt-5">
            <h3 className="font-semibold text-red-400 mb-1">Danger zone</h3>
            <p className="text-sm text-gray-400 mb-3">
              Once you delete your account, all your data will be permanently removed.
            </p>
            <button className="px-4 py-2 text-sm rounded-lg border border-red-800 text-red-400 hover:bg-red-900/20 transition-colors">
              Delete account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
