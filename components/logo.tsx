import Link from "next/link";
import { TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => {
    return (
        <Link
            href="/"
            className={cn(
                "flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                className,
            )}
        >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <TrendingUp className="size-4" strokeWidth={2.5} aria-hidden />
            </span>
            <span className="text-base font-semibold tracking-tight">Finance</span>
        </Link>
    );
};
