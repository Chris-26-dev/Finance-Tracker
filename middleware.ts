import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
    "/sign-in(.*)",
    "/sign-up(.*)",
]);

// API routes authenticate inside each Hono handler and answer with JSON 401s.
// auth.protect() would turn unauthenticated API calls into 404 responses.
const isApiRoute = createRouteMatcher([
    "/api(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request) && !isApiRoute(request)) {
        // Redirects document requests to the sign-in page.
        await auth.protect();
    }

    return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
