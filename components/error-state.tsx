import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

type Props = {
    title?: string;
    error?: Error | null;
    onRetry?: () => void;
    className?: string;
};

export const ErrorState = ({ title = "Something went wrong", error, onRetry, className }: Props) => {
    return (
        <div role="alert">
            <EmptyState
                icon={AlertTriangle}
                title={title}
                description={error?.message ?? "Please try again."}
                className={className}
                action={onRetry && (
                    <Button variant="outline" size="sm" onClick={onRetry}>
                        <RotateCw className="size-4" />
                        Try again
                    </Button>
                )}
            />
        </div>
    );
};
