import { cn } from "@/lib/utils";
import { IMPORT_FIELDS, REQUIRED_IMPORT_FIELDS } from "@/lib/csv-import";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

type Props = {
    columnIndex: number,
    header: string;
    selectedColumns: Record<string, string | null>;
    onChange: (
        columnIndex: number,
        value: string | null
    ) => void;
};

export const TableHeadSelect = ({
    columnIndex,
    header,
    selectedColumns,
    onChange,
}: Props) => {
    const currentSelection = selectedColumns[`column_${columnIndex}`];

    return (
        <div className="flex flex-col gap-1 py-2">
            <span className="text-xs font-normal text-muted-foreground truncate max-w-40" title={header}>
                {header || `Column ${columnIndex + 1}`}
            </span>
            <Select
                value={currentSelection || ""}
                onValueChange={(value) => onChange(columnIndex, value)}
            >
                <SelectTrigger
                    size="sm"
                    aria-label={`Map column ${header || columnIndex + 1}`}
                    className={cn("min-w-28 capitalize",
                        currentSelection && "border-primary text-primary",
                    )}
                >
                    <SelectValue placeholder="Skip" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="skip">Skip</SelectItem>
                    {IMPORT_FIELDS.map((option) => {
                        const disabled = Object.values(selectedColumns).includes(option)
                            && selectedColumns[`column_${columnIndex}`] !== option;
                        const required = (REQUIRED_IMPORT_FIELDS as readonly string[]).includes(option);
                        return (
                            <SelectItem
                                key={option}
                                value={option}
                                disabled={disabled}
                                className="capitalize"
                            >
                                {option}{required ? "" : " (optional)"}
                            </SelectItem>
                        )
                    })}
                </SelectContent>
            </Select>
        </div>
    );
};
