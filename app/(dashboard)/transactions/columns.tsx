"use client"

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { Checkbox } from "@/components/ui/checkbox"
import { SortableHeader } from "@/components/sortable-header";
import { Amount } from "@/components/amount";
import { Actions } from "@/app/(dashboard)/transactions/actions";
import { useGetTransactions } from "@/features/transactions/api/use-get-transactions";
import { toLocalCalendarDate } from "@/lib/utils";
import { AccountColumn } from "./account-column";
import { CategoryColumn } from "./category-column";

export type ResponseType = NonNullable<ReturnType<typeof useGetTransactions>["data"]>[number];

export const columns: ColumnDef<ResponseType>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all on this page"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={`Select ${row.original.payee}`}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    header: ({ column }) => <SortableHeader column={column} title="Date" />,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground tabular-nums">
        {format(toLocalCalendarDate(row.original.date), "MMM d, yyyy")}
      </span>
    ),
  },
  {
    accessorKey: "payee",
    header: ({ column }) => <SortableHeader column={column} title="Payee" />,
    cell: ({ row }) => (
      <div className="min-w-0 max-w-64">
        <p className="truncate font-medium">{row.original.payee}</p>
        {row.original.notes && (
          <p className="truncate text-xs text-muted-foreground" title={row.original.notes}>
            {row.original.notes}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => <SortableHeader column={column} title="Category" />,
    cell: ({ row }) => (
      <CategoryColumn
        id={row.original.id}
        category={row.original.category}
        categoryId={row.original.categoryId}
      />
    ),
  },
  {
    accessorKey: "account",
    header: ({ column }) => <SortableHeader column={column} title="Account" />,
    cell: ({ row }) => (
      <AccountColumn
        account={row.original.account}
        accountId={row.original.accountId}
      />
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <SortableHeader column={column} title="Amount" align="right" />,
    cell: ({ row }) => (
      <div className="text-right">
        <Amount value={row.original.amount} />
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="text-right">
        <Actions id={row.original.id} label={row.original.payee} />
      </div>
    ),
  }
];
