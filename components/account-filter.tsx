"use client";

import qs from "query-string";
import { Wallet } from "lucide-react";
import {
    usePathname,
    useRouter,
    useSearchParams
} from "next/navigation";

import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

export const AccountFilter = () => {
    const router = useRouter();
    const pathname = usePathname();

    const params = useSearchParams();
    const accountId = params.get("accountId") || "all";
    const from = params.get("from") || "";
    const to = params.get("to") || "";

    const {
        data: accounts,
        isLoading: isLoadingAccounts
    } = useGetAccounts();

    const onChange = (newValue: string) => {
        const query = {
            accountId: newValue,
            from,
            to,
        };

        if (newValue === "all") {
            query.accountId = "";
        }

        const url = qs.stringifyUrl({
            url: pathname,
            query,
        }, { skipNull: true, skipEmptyString: true });

        router.push(url);
    };

    // A stale accountId (e.g. a deleted account) falls back to "All accounts".
    const value = accountId === "all" || accounts?.some((account) => account.id === accountId)
        ? accountId
        : "all";

    return (
        <Select
            value={value}
            onValueChange={onChange}
            disabled={isLoadingAccounts}
        >
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter by account">
                <span className="flex min-w-0 items-center gap-2">
                    <Wallet className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <SelectValue placeholder="Select account" />
                </span>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">
                    All accounts
                </SelectItem>
                {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                        {account.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
