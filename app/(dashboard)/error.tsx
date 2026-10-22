"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/error-state";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="rounded-lg border bg-card">
            <ErrorState
                title="This page couldn't be displayed"
                error={new Error("An unexpected error occurred. Try again, or reload the page.")}
                onRetry={reset}
            />
        </div>
    );
}
