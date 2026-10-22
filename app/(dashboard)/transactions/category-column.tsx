import { TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { useOpenCategory } from "@/features/categories/hooks/use-open-category";
import { useOpenTransaction } from "@/features/transactions/hooks/use-open-transaction";

type Props = {
    id: string;
    category: string | null;
    categoryId: string | null;
};

export const CategoryColumn = ({
    id,
    category,
    categoryId
}: Props) => {
    const {onOpen: onOpenCategory} = useOpenCategory();
    const {onOpen: onOpenTransaction} = useOpenTransaction();

    // A category the caller can't see (legacy data) is treated as missing.
    const hasCategory = !!category && !!categoryId;

    const onClick = () => {
        if (hasCategory) {
            onOpenCategory(categoryId)
        } else {
            onOpenTransaction(id);
        }
    }

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={hasCategory ? `Edit category ${category}` : "Assign a category"}
            className={cn(
                "inline-flex max-w-40 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                hasCategory
                    ? "bg-secondary text-secondary-foreground hover:bg-accent"
                    : "border-warning/40 text-warning hover:bg-warning/10",
            )}
        >
            {!hasCategory && <TriangleAlert className="size-3 shrink-0" aria-hidden />}
            <span className="truncate">{hasCategory ? category : "Uncategorized"}</span>
        </button>
    );
};
