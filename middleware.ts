import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
  "/foods(.*)",
  "/log(.*)",
  "/planner(.*)",
  "/coach(.*)",
  "/progress(.*)",
  "/grocery(.*)",
  "/reports(.*)",
  "/pricing(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|otf|webmanifest|txt|xml|pdf|zip)).*)",
    "/(api|trpc)(.*)",
  ],
};
