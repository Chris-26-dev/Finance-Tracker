"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeftRight, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";

import { useNewTransaction } from "@/features/transactions/hooks/use-new-transaction";
import { useOpenTransaction } from "@/features/transactions/hooks/use-open-transaction";
import { useGetTransactions } from "@/features/transactions/api/use-get-transactions";
import { useBulkDeleteTransactions } from "@/features/transactions/api/use-bulk-delete-transactions";
import { useBulkCreateTransactions } from "@/features/transactions/api/use-bulk-create-transactions";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useNewAccount } from "@/features/accounts/hooks/use-new-account";
import { useSelectAccount } from "@/features/accounts/hooks/use-select-account";

import { ImportRow } from "@/lib/csv-import";
import { parseDayParam, toLocalCalendarDate } from "@/lib/utils";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Amount } from "@/components/amount";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/table-skeleton";

import { columns } from "./columns";
import { CsvParseResult, UploadButton } from "./upload-button";
import { ImportCard } from "./import-card";

enum VARIANTS {
    LIST = "LIST",
    IMPORT = "IMPORT"
};

const INITIAL_IMPORT_RESULTS: CsvParseResult = {
    data: [],
    errors: [],
};

const TransactionsPage = () => {
    const [AccountDialog, confirm] = useSelectAccount();
    const [variant, setVariant] = useState<VARIANTS>(VARIANTS.LIST);
    const [importResults, setImportResults] = useState(INITIAL_IMPORT_RESULTS);

    const onUpload = (results: CsvParseResult) => {
        setImportResults(results);
        setVariant(VARIANTS.IMPORT);
    };

    const onCancelImport = () => {
        setImportResults(INITIAL_IMPORT_RESULTS);
        setVariant(VARIANTS.LIST);
    }

    const newTransaction = useNewTransaction();
    const openTransaction = useOpenTransaction();
    const newAccount = useNewAccount();
    const createTransactions = useBulkCreateTransactions();
    const deleteTransactions = useBulkDeleteTransactions();
    const transactionsQuery = useGetTransactions();
    const accountsQuery = useGetAccounts();
    const transactions = transactionsQuery.data || [];

    const isDisabled =
        transactionsQuery.isLoading ||
        deleteTransactions.isPending;

    const hasNoAccounts = accountsQuery.isSuccess && accountsQuery.data.length === 0;

    const onSubmitImport = async (rows: ImportRow[]) => {
        const accountId = await confirm();

        if(!accountId) {
            return toast.info("Import cancelled", {
                description: "Choose an account to import these transactions into.",
            });
        }

        const data = rows.map((row) => ({
            date: parseDayParam(row.date)!,
            amount: row.amount,
            payee: row.payee,
            notes: row.notes,
            categoryId: null,
            accountId,
        }));

        createTransactions.mutate(data, {
            onSuccess: () => {
                onCancelImport();
            },
        });
    };

    if (variant === VARIANTS.IMPORT) {
        return (
            <>
                <AccountDialog />
                <ImportCard
                    data={importResults.data}
                    onCancel={onCancelImport}
                    onSubmit={onSubmitImport}
                    disabled={createTransactions.isPending}
                />
            </>
        )
    }

    const emptyState = hasNoAccounts ? (
        <EmptyState
            icon={Wallet}
            title="Create an account first"
            description="Transactions belong to an account, such as Checking or Cash."
            action={
                <Button onClick={newAccount.onOpen}>
                    <Plus className="size-4" />
                    New account
                </Button>
            }
        />
    ) : (
        <EmptyState
            icon={ArrowLeftRight}
            title="No transactions in this period"
            description="Add one manually, import a CSV from your bank, or widen the date range."
            action={
                <>
                    <Button onClick={newTransaction.onOpen}>
                        <Plus className="size-4" />
                        Add transaction
                    </Button>
                    <UploadButton onUpload={onUpload} />
                </>
            }
        />
    );

    return (
        <div className="space-y-6">
            <PageHeader
                description="Every income and expense in the selected period."
                actions={
                    <>
                        <UploadButton onUpload={onUpload} disabled={hasNoAccounts} />
                        <Button onClick={newTransaction.onOpen}>
                            <Plus className="size-4" />
                            Add transaction
                        </Button>
                    </>
                }
            />
            {transactionsQuery.isLoading ? (
                <TableSkeleton rows={8} />
            ) : transactionsQuery.isError ? (
                <div className="rounded-lg border bg-card">
                    <ErrorState
                        title="Couldn't load transactions"
                        error={transactionsQuery.error}
                        onRetry={() => transactionsQuery.refetch()}
                    />
                </div>
            ) : (
                <DataTable
                    searchKeys={["payee", "category", "account", "notes"]}
                    searchPlaceholder="Search payee, category, notes…"
                    columns={columns}
                    data={transactions}
                    onDelete={(row) => {
                        const ids = row.map((r) => r.original.id);
                        deleteTransactions.mutate({ ids });
                    }}
                    deleteDescription={(count) =>
                        `${count === 1 ? "This transaction" : `These ${count} transactions`} will be permanently deleted.`
                    }
                    disabled={isDisabled}
                    emptyState={<div className="rounded-lg border border-dashed bg-card">{emptyState}</div>}
                    renderMobileRow={(row) => (
                        <button
                            type="button"
                            onClick={() => openTransaction.onOpen(row.original.id)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left outline-none hover:bg-muted/50 focus-visible:bg-muted/50"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{row.original.payee}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {row.original.category ?? "Uncategorized"} · {row.original.account}
                                </p>
                            </div>
                            <div className="text-right">
                                <Amount value={row.original.amount} className="block text-sm" />
                                <span className="text-xs text-muted-foreground">
                                    {format(toLocalCalendarDate(row.original.date), "MMM d")}
                                </span>
                            </div>
                        </button>
                    )}
                />
            )}
        </div>
    );
};

export default TransactionsPage;
