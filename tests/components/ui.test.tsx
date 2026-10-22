// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { PiggyBank } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

// The display currency comes from Clerk; default it to EUR to prove it's used.
vi.mock("@clerk/nextjs", () => ({
    useUser: () => ({ user: { unsafeMetadata: { currency: "EUR" } }, isLoaded: true }),
}));

import { DataCard } from "@/components/data-card";
import { DataTable } from "@/components/data-table";
import { Amount } from "@/components/amount";

// Vitest runs without globals, so unmount explicitly between tests.
afterEach(cleanup);

describe("DataCard trend semantics", () => {
    it("shows rising expenses as bad", () => {
        render(<DataCard title="Expenses" value={-250} percentageChange={150} icon={PiggyBank} tone="expense" dateRange="Mar 1 - Mar 3" invertTrend />);
        const trend = screen.getByText("Up 150%");
        expect(trend.className).toContain("text-destructive");
    });

    it("shows rising income as good", () => {
        render(<DataCard title="Income" value={100} percentageChange={20} icon={PiggyBank} tone="income" dateRange="" />);
        expect(screen.getByText("Up 20%").className).toContain("text-success");
    });

    it("shows falling expenses as good", () => {
        render(<DataCard title="Expenses" value={-10} percentageChange={-40} icon={PiggyBank} tone="expense" dateRange="" invertTrend />);
        expect(screen.getByText("Down 40%").className).toContain("text-success");
    });
});

describe("Amount", () => {
    it("formats in the user's currency with an explicit sign", () => {
        const { rerender } = render(<Amount value={12.5} />);
        expect(screen.getByText("+€12.50")).toBeTruthy();
        rerender(<Amount value={-1234.5} />);
        expect(screen.getByText("-€1,234.50")).toBeTruthy();
    });
});

type Row = { id: string; payee: string; notes: string | null };

const columns: ColumnDef<Row>[] = [
    { accessorKey: "payee", header: "Payee" },
];

const rows: Row[] = [
    { id: "1", payee: "Grocer", notes: "weekly shop" },
    { id: "2", payee: "Cinema", notes: null },
];

describe("DataTable", () => {
    it("searches across several fields", () => {
        render(<DataTable columns={columns} data={rows} searchKeys={["payee", "notes"]} onDelete={() => {}} />);
        const table = screen.getByRole("table");

        fireEvent.change(screen.getByRole("searchbox"), { target: { value: "WEEKLY" } });
        expect(within(table).getByText("Grocer")).toBeTruthy();
        expect(within(table).queryByText("Cinema")).toBeNull();
    });

    it("shows a no-results message that names the query", () => {
        render(<DataTable columns={columns} data={rows} searchKeys={["payee"]} onDelete={() => {}} />);
        fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz" } });
        expect(screen.getByText("No results for “zzz”.")).toBeTruthy();
    });

    it("renders the empty state when there is no data", () => {
        render(
            <DataTable
                columns={columns}
                data={[]}
                searchKeys={["payee"]}
                onDelete={() => {}}
                emptyState={<p>Nothing yet — add one</p>}
            />,
        );
        expect(screen.getByText("Nothing yet — add one")).toBeTruthy();
        expect(screen.queryByRole("table")).toBeNull();
    });

    it("asks for confirmation, naming the count, before bulk deleting", async () => {
        const onDelete = vi.fn();
        const selectable: ColumnDef<Row>[] = [
            {
                id: "select",
                cell: ({ row }) => (
                    <input type="checkbox" aria-label={`select ${row.original.payee}`} onChange={() => row.toggleSelected()} />
                ),
            },
            ...columns,
        ];
        render(<DataTable columns={selectable} data={rows} searchKeys={["payee"]} onDelete={onDelete} />);

        fireEvent.click(screen.getByLabelText("select Grocer"));
        fireEvent.click(screen.getByRole("button", { name: "Delete" }));

        const dialog = await screen.findByRole("dialog");
        expect(within(dialog).getByText("Delete 1 item?")).toBeTruthy();
        expect(onDelete).not.toHaveBeenCalled();

        fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
        await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
        expect(onDelete.mock.calls[0][0].map((row: { original: Row }) => row.original.id)).toEqual(["1"]);
    });
});
