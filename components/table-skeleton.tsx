import { Skeleton } from "@/components/ui/skeleton";

export const TableSkeleton = ({ rows = 6 }: { rows?: number }) => {
    return (
        <div className="space-y-4" aria-busy="true" aria-label="Loading">
            <Skeleton className="h-9 w-full sm:max-w-xs" />
            <div className="overflow-hidden rounded-lg border bg-card">
                <div className="border-b bg-muted/40 px-4 py-3">
                    <Skeleton className="h-4 w-1/3" />
                </div>
                {Array.from({ length: rows }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4 border-b px-4 py-3.5 last:border-0">
                        <Skeleton className="size-4" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                ))}
            </div>
        </div>
    );
};
