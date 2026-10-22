"use client"

import * as React from "react";

import {
    ColumnDef,
    FilterFn,
    Row,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, Search, Trash, X } from "lucide-react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { useConfirm } from "@/hooks/use-confirm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    /** Fields matched by the search box (case-insensitive substring). */
    searchKeys: (keyof TData & string)[]
    searchPlaceholder?: string
    onDelete: (rows: Row<TData>[]) => void;
    /** Confirmation text for bulk delete, e.g. consequences for N rows. */
    deleteDescription?: (count: number) => string;
    disabled?: boolean;
    /** Optional card layout used below the `md` breakpoint. */
    renderMobileRow?: (row: Row<TData>) => React.ReactNode;
    emptyState?: React.ReactNode;
    toolbar?: React.ReactNode;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKeys,
    searchPlaceholder = "Search…",
    onDelete,
    deleteDescription = (count) => `${count} selected item${count === 1 ? "" : "s"} will be permanently deleted.`,
    disabled,
    renderMobileRow,
    emptyState,
    toolbar,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = React.useState("");
    const [rowSelection, setRowSelection] = React.useState({})
    const [pendingDelete, setPendingDelete] = React.useState(0);

    const [ConfirmDialog, confirm] = useConfirm(
        `Delete ${pendingDelete} item${pendingDelete === 1 ? "" : "s"}?`,
        deleteDescription(pendingDelete),
        { confirmLabel: "Delete", destructive: true },
    );

    const searchFilter = React.useCallback<FilterFn<TData>>((row, _columnId, value: string) => {
        const query = value.trim().toLowerCase();
        if (!query) return true;
        return searchKeys.some((key) => {
            const field = row.original[key];
            return field != null && String(field).toLowerCase().includes(query);
        });
    }, [searchKeys]);

    // Clear selection whenever the underlying data changes (e.g. after a
    // delete or a filter change) so stale rows can't be bulk-deleted.
    React.useEffect(() => {
        setRowSelection({});
    }, [data]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: searchFilter,
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        autoResetPageIndex: true,
        initialState: {
            pagination: { pageSize: 20 },
        },
        state: {
            sorting,
            globalFilter,
            rowSelection,
        },
    });

    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const rows = table.getRowModel().rows;
    const pageCount = table.getPageCount();
    const isFiltered = globalFilter.trim().length > 0;

    const onBulkDelete = async () => {
        setPendingDelete(selectedRows.length);
        const ok = await confirm();

        if (ok) {
            onDelete(selectedRows);
            table.resetRowSelection();
        }
    };

    if (data.length === 0 && emptyState) {
        return <>{emptyState}</>;
    }

    const noResults = (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            {isFiltered ? `No results for “${globalFilter.trim()}”.` : "Nothing here yet."}
        </div>
    );

    return (
        <div className="space-y-4">
            <ConfirmDialog />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input
                        type="search"
                        aria-label={searchPlaceholder}
                        placeholder={searchPlaceholder}
                        value={globalFilter}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="pl-9"
                    />
                </div>
                {toolbar}
                {selectedRows.length > 0 && (
                    <div className="flex items-center gap-2 sm:ml-auto">
                        <span className="text-sm text-muted-foreground">
                            {selectedRows.length} selected
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => table.resetRowSelection()}
                            aria-label="Clear selection"
                        >
                            <X className="size-4" />
                        </Button>
                        <Button
                            disabled={disabled}
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={onBulkDelete}
                        >
                            <Trash className="size-4" />
                            Delete
                        </Button>
                    </div>
                )}
            </div>

            {renderMobileRow && (
                <div className="overflow-hidden rounded-lg border bg-card md:hidden">
                    {rows.length ? (
                        <ul className="divide-y">
                            {rows.map((row) => (
                                <li key={row.id}>{renderMobileRow(row)}</li>
                            ))}
                        </ul>
                    ) : noResults}
                </div>
            )}

            <div className={cn("overflow-hidden rounded-lg border bg-card", renderMobileRow && "hidden md:block")}>
                <Table>
                    <TableHeader className="bg-muted/40">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className="h-10 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                                            aria-sort={
                                                header.column.getIsSorted() === "asc"
                                                    ? "ascending"
                                                    : header.column.getIsSorted() === "desc"
                                                        ? "descending"
                                                        : undefined
                                            }
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {rows.length ? (
                            rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-2.5">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={columns.length} className="p-0">
                                    {noResults}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
                <span>
                    {table.getFilteredRowModel().rows.length} result{table.getFilteredRowModel().rows.length === 1 ? "" : "s"}
                </span>
                {pageCount > 1 && (
                    <div className="flex items-center gap-2">
                        <span className="tabular-nums">
                            Page {table.getState().pagination.pageIndex + 1} of {pageCount}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            aria-label="Next page"
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
