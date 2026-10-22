import { useMemo, useState } from "react";
import { AlertCircle, Info } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
 } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    buildImportReport,
    ColumnMapping,
    DATE_FORMATS,
    DateFormat,
    detectDateFormat,
    ImportField,
    ImportRow,
    NumberFormat,
    REQUIRED_IMPORT_FIELDS,
} from "@/lib/csv-import";
import { MAX_BULK_TRANSACTIONS } from "@/db/schema";
import { ImportTable, PREVIEW_ROW_LIMIT } from "./import-table";

interface SelectedColumnsState {
    [key: string]: string | null;
}

type Props = {
    data: string[][];
    onCancel: () => void;
    onSubmit: (rows: ImportRow[]) => void;
    disabled?: boolean;
}

const ERROR_LIST_LIMIT = 50;

export const ImportCard = ({
    data,
    onCancel,
    onSubmit,
    disabled,
}:Props) => {
    const [selectedColumns, setSelectedColumns] = useState<SelectedColumnsState>({});
    const [dateFormatChoice, setDateFormatChoice] = useState<DateFormat | null>(null);
    const [numberFormat, setNumberFormat] = useState<NumberFormat>("dot");
    const [skipDuplicates, setSkipDuplicates] = useState(false);

    const headers = useMemo(() => data[0] ?? [], [data]);
    const body = useMemo(() => data.slice(1), [data]);

    const onTableHeadSelectChange = (
        columnIndex: number,
        value: string | null
    ) => {
        setSelectedColumns((prev) => {
            const newSelectedColumns = {...prev};

            for (const key in newSelectedColumns) {
                if(newSelectedColumns[key] === value) {
                    newSelectedColumns[key] = null;
                }
            }

            if (value === "skip"){
                value = null;
            }

            newSelectedColumns[`column_${columnIndex}`] = value;
            return newSelectedColumns;
        });
    };

    const mapping = useMemo(() => {
        const result: ColumnMapping = {};
        for (const [key, field] of Object.entries(selectedColumns)) {
            if (field) {
                result[field as ImportField] = Number(key.split("_")[1]);
            }
        }
        return result;
    }, [selectedColumns]);

    const missingFields = REQUIRED_IMPORT_FIELDS.filter((field) => mapping[field] === undefined);
    const isMapped = missingFields.length === 0;

    const detection = useMemo(() => {
        if (mapping.date === undefined) return null;
        return detectDateFormat(body.map((row) => row[mapping.date!] ?? ""));
    }, [body, mapping.date]);

    // An explicit choice always wins over detection.
    const dateFormat = dateFormatChoice ?? detection?.detected ?? null;

    const report = useMemo(() => {
        if (!isMapped) return null;
        return buildImportReport({ headers, body, mapping, dateFormat, numberFormat });
    }, [isMapped, headers, body, mapping, dateFormat, numberFormat]);

    const rowErrors = useMemo(
        () => new Map((report?.errors ?? []).map((error) => [error.rowNumber, error.messages])),
        [report],
    );
    const duplicateRows = useMemo(() => new Set(report?.duplicateRowNumbers ?? []), [report]);

    const rowsToImport = useMemo(() => {
        if (!report) return [];
        return skipDuplicates
            ? report.rows.filter((row) => !duplicateRows.has(row.rowNumber))
            : report.rows;
    }, [report, skipDuplicates, duplicateRows]);

    const tooMany = rowsToImport.length > MAX_BULK_TRANSACTIONS;
    const canImport = !!report && !!dateFormat && rowsToImport.length > 0 && !tooMany && !disabled;

    return(
        <div className="space-y-6">
            <Card>
                <CardHeader className="gap-1">
                    <CardTitle className="text-lg">Import transactions</CardTitle>
                    <CardDescription>
                        Map the <strong>date</strong>, <strong>payee</strong> and <strong>amount</strong> columns, confirm the formats, then review before importing.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
                        <div className="space-y-2">
                            <Label htmlFor="import-date-format">Date format</Label>
                            <Select
                                value={dateFormat ?? ""}
                                onValueChange={(value) => setDateFormatChoice(value as DateFormat)}
                                disabled={mapping.date === undefined}
                            >
                                <SelectTrigger id="import-date-format" className="w-full">
                                    <SelectValue placeholder="Map a date column first" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DATE_FORMATS.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                            disabled={!!detection && detection.candidates.length > 0 && !detection.candidates.includes(option.value)}
                                        >
                                            {option.example}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {detection?.ambiguous && !dateFormatChoice && (
                                <p className="text-sm text-warning flex gap-1.5">
                                    <Info className="size-4 shrink-0 mt-0.5" />
                                    These dates could be day-first or month-first. Choose the format your bank uses.
                                </p>
                            )}
                            {detection && detection.candidates.length === 0 && (
                                <p className="text-sm text-destructive flex gap-1.5">
                                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                    Some dates don&apos;t match any supported format. Rows that fail will be listed below.
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="import-number-format">Number format</Label>
                            <Select
                                value={numberFormat}
                                onValueChange={(value) => setNumberFormat(value as NumberFormat)}
                            >
                                <SelectTrigger id="import-number-format" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dot">1,234.56</SelectItem>
                                    <SelectItem value="comma">1.234,56</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Negative amounts are expenses. Accepts -12.00, (12.00) and currency symbols.
                            </p>
                        </div>
                    </div>

                    <ImportTable
                        headers={headers}
                        body={body}
                        selectedColumns={selectedColumns}
                        onTableHeadSelectChange={onTableHeadSelectChange}
                        rowErrors={rowErrors}
                        duplicateRows={duplicateRows}
                    />
                    {body.length > PREVIEW_ROW_LIMIT && (
                        <p className="text-xs text-muted-foreground">
                            Showing the first {PREVIEW_ROW_LIMIT} of {body.length} rows. Every row is validated.
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="gap-1">
                    <CardTitle className="text-lg">Review</CardTitle>
                    <CardDescription>
                        {!isMapped
                            ? `Map the ${missingFields.join(", ")} column${missingFields.length > 1 ? "s" : ""} to continue.`
                            : `${report?.rows.length ?? 0} of ${body.length - (report?.skippedEmpty ?? 0)} rows are ready to import.`}
                    </CardDescription>
                </CardHeader>
                {report && (
                    <CardContent className="space-y-4">
                        {report.errors.length > 0 && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4" role="alert">
                                <p className="text-sm font-medium text-destructive flex items-center gap-2">
                                    <AlertCircle className="size-4" />
                                    {report.errors.length} row{report.errors.length > 1 ? "s" : ""} can&apos;t be imported and will be skipped
                                </p>
                                <ul className="mt-2 max-h-48 overflow-y-auto space-y-1 text-sm">
                                    {report.errors.slice(0, ERROR_LIST_LIMIT).map((error) => (
                                        <li key={error.rowNumber}>
                                            <span className="font-medium tabular-nums">Row {error.rowNumber}:</span>{" "}
                                            <span className="text-muted-foreground">{error.messages.join("; ")}</span>
                                        </li>
                                    ))}
                                </ul>
                                {report.errors.length > ERROR_LIST_LIMIT && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        And {report.errors.length - ERROR_LIST_LIMIT} more.
                                    </p>
                                )}
                            </div>
                        )}
                        {report.duplicateRowNumbers.length > 0 && (
                            <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
                                <Checkbox
                                    id="skip-duplicates"
                                    checked={skipDuplicates}
                                    onCheckedChange={(value) => setSkipDuplicates(value === true)}
                                    className="mt-0.5"
                                />
                                <Label htmlFor="skip-duplicates" className="block font-normal leading-snug">
                                    Skip {report.duplicateRowNumbers.length} possible duplicate row{report.duplicateRowNumbers.length > 1 ? "s" : ""}
                                    <span className="block text-xs text-muted-foreground mt-1">
                                        Same date, amount and payee as an earlier row in this file (rows {report.duplicateRowNumbers.slice(0, 10).join(", ")}{report.duplicateRowNumbers.length > 10 ? ", …" : ""}).
                                    </span>
                                </Label>
                            </div>
                        )}
                        {tooMany && (
                            <p className="text-sm text-destructive">
                                You can import up to {MAX_BULK_TRANSACTIONS.toLocaleString()} transactions at a time. Split the file and try again.
                            </p>
                        )}
                    </CardContent>
                )}
                <CardContent className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={onCancel} disabled={disabled}>
                        Cancel
                    </Button>
                    <Button onClick={() => onSubmit(rowsToImport)} disabled={!canImport}>
                        Import {rowsToImport.length} transaction{rowsToImport.length === 1 ? "" : "s"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
