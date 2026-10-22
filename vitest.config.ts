import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "."),
        },
    },
    // tsconfig uses `jsx: "preserve"` for Next.js; tests need a real transform.
    oxc: {
        jsx: {
            runtime: "automatic",
        },
    },
    test: {
        environment: "node",
        // Run west of UTC, where calendar-day shifting bugs show up.
        env: {
            TZ: "America/Los_Angeles",
        },
        include: ["tests/**/*.test.{ts,tsx}"],
        // PGlite boots a WASM Postgres per test file.
        testTimeout: 20_000,
        hookTimeout: 60_000,
    },
});
