import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
    return (
        <main className="flex min-h-screen items-center justify-center p-4">
            <EmptyState
                icon={FileQuestion}
                title="Page not found"
                description="The page you're looking for doesn't exist or has moved."
                action={
                    <Button asChild>
                        <Link href="/">Back to overview</Link>
                    </Button>
                }
            />
        </main>
    );
}
