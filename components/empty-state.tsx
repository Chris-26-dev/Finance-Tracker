import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
    icon: LucideIcon;
    title: string;
    description?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
};

export const EmptyState = ({ icon: Icon, title, description, action, className }: Props) => {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-12 text-center", className)}>
            <div className="flex size-11 items-center justify-center rounded-full bg-muted">
                <Icon className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div className="max-w-sm space-y-1">
                <p className="font-medium">{title}</p>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
        </div>
    );
};
