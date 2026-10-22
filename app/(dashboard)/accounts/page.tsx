"use client";

import { Plus, Wallet } from "lucide-react";

import { useNewAccount } from "@/features/accounts/hooks/use-new-account";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useBulkDeleteAccounts } from "@/features/accounts/api/use-bulk-delete-accounts";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/table-skeleton";

import { columns } from "./columns";

const AccountsPage = () => {
    const newAccount = useNewAccount();
    const deleteAccounts = useBulkDeleteAccounts();
    const accountsQuery = useGetAccounts();
    const accounts = accountsQuery.data || [];

    const isDisabled =
        accountsQuery.isLoading ||
        deleteAccounts.isPending;

    return (
        <div className="space-y-6">
            <PageHeader
                description="Accounts are where your money lives, like a bank account, card or cash."
                actions={
                    <Button onClick={newAccount.onOpen}>
                        <Plus className="size-4" />
                        New account
                    </Button>
                }
            />
            {accountsQuery.isLoading ? (
                <TableSkeleton />
            ) : accountsQuery.isError ? (
                <div className="rounded-lg border bg-card">
                    <ErrorState
                        title="Couldn't load accounts"
                        error={accountsQuery.error}
                        onRetry={() => accountsQuery.refetch()}
                    />
                </div>
            ) : (
                <DataTable
                    searchKeys={["name"]}
                    searchPlaceholder="Search accounts"
                    columns={columns}
                    data={accounts}
                    onDelete={(row) => {
                        const ids = row.map((r) => r.original.id);
                        deleteAccounts.mutate({ ids });
                    }}
                    deleteDescription={(count) =>
                        `${count === 1 ? "This account" : `These ${count} accounts`} and all of their transactions will be permanently deleted.`
                    }
                    disabled={isDisabled}
                    emptyState={
                        <div className="rounded-lg border border-dashed bg-card">
                            <EmptyState
                                icon={Wallet}
                                title="No accounts yet"
                                description="Create an account to start recording transactions."
                                action={
                                    <Button onClick={newAccount.onOpen}>
                                        <Plus className="size-4" />
                                        New account
                                    </Button>
                                }
                            />
                        </div>
                    }
                />
            )}
        </div>
    );
};

export default AccountsPage;
