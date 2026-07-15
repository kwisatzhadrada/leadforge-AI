import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function FounderLayout({ children }: { children: React.ReactNode }) {
  const { userId } = auth();
  if (!userId) {
    redirect("/sign-in");
  }
  // Note: founder role verification happens in the API layer
  // This layout just ensures the user is authenticated
  return <>{children}</>;
}
