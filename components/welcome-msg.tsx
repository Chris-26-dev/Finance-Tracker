"use client";

import { useUser } from "@clerk/nextjs";
import { Plus, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useNewAccount } from "@/features/accounts/hooks/use-new-account";

const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
};

export const WelcomeMsg = () => {
    const { user, isLoaded } = useUser();
    const accountsQuery = useGetAccounts();
    const newAccount = useNewAccount();

    const name = user?.firstName?.trim();
    const hasNoAccounts = accountsQuery.isSuccess && accountsQuery.data.length === 0;

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                {isLoaded ? (
                    <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                        {greeting()}{name ? `, ${name}` : ""}
                    </h2>
                ) : (
                    <Skeleton className="h-7 w-56" />
                )}
                <p className="text-sm text-muted-foreground">
                    Here&apos;s how your money moved in the selected period.
                </p>
            </div>
            {hasNoAccounts && (
                <Card className="flex-col items-start gap-4 border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Wallet className="size-5" aria-hidden />
                    </div>
                    <div className="flex-1 space-y-1">
                        <p className="font-medium">Set up your first account</p>
                        <p className="text-sm text-muted-foreground">
                            Accounts hold your transactions, for example &ldquo;Checking&rdquo; or &ldquo;Cash&rdquo;. Add one, then record or import transactions.
                        </p>
                    </div>
                    <Button onClick={newAccount.onOpen}>
                        <Plus className="size-4" />
                        Add account
                    </Button>
                </Card>
            )}
        </div>
    )
}
