import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Public routes — no auth required
  publicRoutes: [
    "/",
    "/demo",
    "/results/(.*)",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/backend/webhooks/(.*)",
  ],
  // Redirect unauthenticated users from protected routes
  ignoredRoutes: [
    "/api/backend/webhooks/(.*)",
    "/_next/(.*)",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
  ],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
