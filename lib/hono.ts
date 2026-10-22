import { hc } from "hono/client";

import { AppType } from "@/app/api/[[...route]]/route";

// The API is served by this same app, so default to the page's origin.
// NEXT_PUBLIC_APP_URL is only needed to point at an API hosted elsewhere.
const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

export const client = hc<AppType>(baseUrl);
