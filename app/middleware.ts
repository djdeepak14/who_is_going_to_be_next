import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public: Homepage, Polls list/detail, Arrestee detail
const isPublicRoute = createRouteMatcher([
  '/', 
  '/polls(.*)', 
  '/arrestee/(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)'
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect(); 
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};