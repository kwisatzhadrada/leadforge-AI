"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function SSOCallbackPage() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        <p className="text-sm">Finishing sign up…</p>
      </div>
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/dashboard"
      />
    </main>
  );
}
