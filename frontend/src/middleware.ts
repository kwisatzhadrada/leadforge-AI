import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that do not require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/demo",
  "/results/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
