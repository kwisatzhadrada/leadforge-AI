import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-blue-400">LeadForge</span>
          <span className="text-2xl font-bold text-white"> AI</span>
          <p className="text-gray-400 mt-2 text-sm">
            Get your first growth report free — no card required
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              card: "bg-gray-900 border border-gray-800 shadow-xl",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-400",
              socialButtonsBlockButton: "bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
              formFieldLabel: "text-gray-300",
              formFieldInput: "bg-gray-800 border-gray-700 text-white",
              footerActionLink: "text-blue-400",
              formButtonPrimary: "bg-blue-600 hover:bg-blue-500",
            },
          }}
        />
      </div>
    </main>
  );
}
