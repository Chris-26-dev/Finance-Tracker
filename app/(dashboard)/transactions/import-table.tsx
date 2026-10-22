import { AlertCircle, CheckCircle2, Copy } from "lucide-react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { TableHeadSelect } from "./table-head-select";

export const PREVIEW_ROW_LIMIT = 100;

type Props = {
    headers: string[];
    body: string[][];
    selectedColumns: Record<string, string | null>;
    onTableHeadSelectChange: (columnIndex: number, value: string | null) => void;
    rowErrors: Map<number, string[]>;
    duplicateRows: Set<number>;
};

export const ImportTable = ({
    headers,
    body,
    selectedColumns,
    onTableHeadSelectChange,
    rowErrors,
    duplicateRows,
}: Props) => {
    return (
        <div className="rounded-lg border overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="w-20 text-xs">Row</TableHead>
                        {headers.map((header, index) => (
                            <TableHead key={index}>
                                <TableHeadSelect
                                    columnIndex={index}
                                    header={header}
                                    selectedColumns={selectedColumns}
                                    onChange={onTableHeadSelectChange}
                                />
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {body.slice(0, PREVIEW_ROW_LIMIT).map((row: string[], index) => {
                        const rowNumber = index + 2;
                        const errors = rowErrors.get(rowNumber);
                        const duplicate = duplicateRows.has(rowNumber);

                        return (
                            <TableRow
                                key={index}
                                className={cn(errors && "bg-destructive/5 hover:bg-destructive/10")}
                            >
                                <TableCell className="text-xs text-muted-foreground tabular-nums">
                                    <span className="inline-flex items-center gap-1.5">
                                        {errors ? (
                                            <AlertCircle className="size-3.5 text-destructive" aria-label="Has errors" />
                                        ) : duplicate ? (
                                            <Copy className="size-3.5 text-warning" aria-label="Possible duplicate" />
                                        ) : (
                                            <CheckCircle2 className="size-3.5 text-success" aria-label="Valid" />
                                        )}
                                        {rowNumber}
                                    </span>
                                </TableCell>
                                {row.map((cell, cellIndex) => (
                                    <TableCell key={cellIndex} className="max-w-56 truncate" title={cell}>
                                        {cell}
                                    </TableCell>
                                ))}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};
