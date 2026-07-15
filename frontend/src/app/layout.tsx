import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LeadForge AI — Get More Local Customers",
  description: "AI-powered customer acquisition for UK and US tradespeople. Get your complete growth package in 60 seconds.",
  openGraph: {
    title: "LeadForge AI",
    description: "More customers. Less hassle. In 60 seconds.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.className}>
        <body style={{ background: "#0a0a0f", color: "#fafafa" }}>
          {children}
          <Toaster position="top-right" theme="dark" richColors closeButton />
        </body>
      </html>
    </ClerkProvider>
  );
}
