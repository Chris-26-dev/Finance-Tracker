import { Upload } from "lucide-react";
import { useCSVReader } from "react-papaparse";

import { Button } from "@/components/ui/button";

type Props = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpload: (results: any) => void;
};

export const UploadButton = ({ onUpload }: Props) => {
    const { CSVReader } = useCSVReader();

    // TODO: ADD A PAYWALL - when implement subscriptions and payments 

    return (
        <CSVReader onUploadAccepted={onUpload}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {({ getRootProps }: any) => (
                <Button
                    size="sm"
                    className="w-full lg:w-auto"
                    {...getRootProps()}
                >
                    <Upload className="size-4 mr-2"/>
                    Import
                </Button>
            )}
        </CSVReader>
    );
};