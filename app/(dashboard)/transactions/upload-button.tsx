import { Upload } from "lucide-react";
import { useCSVReader } from "react-papaparse";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export type CsvParseResult = {
    data: string[][];
    errors: { row?: number; message: string }[];
};

type Props = {
    onUpload: (results: CsvParseResult) => void;
    disabled?: boolean;
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const UploadButton = ({ onUpload, disabled }: Props) => {
    const { CSVReader } = useCSVReader();

    // TODO: ADD A PAYWALL - when implement subscriptions and payments

    return (
        <CSVReader
            config={{ skipEmptyLines: "greedy" }}
            maxSize={MAX_FILE_BYTES}
            onUploadAccepted={(results: CsvParseResult) => {
                if (!results.data?.length || results.data.length < 2) {
                    toast.error("That file has no rows to import");
                    return;
                }
                onUpload(results);
            }}
            onUploadRejected={() => {
                toast.error("Couldn't read that file", {
                    description: "Upload a .csv file smaller than 5 MB.",
                });
            }}
        >
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {({ getRootProps }: any) => (
                <Button
                    variant="outline"
                    disabled={disabled}
                    {...getRootProps()}
                >
                    <Upload className="size-4"/>
                    Import CSV
                </Button>
            )}
        </CSVReader>
    );
};
