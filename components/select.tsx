"use client";

//Created generic reusable select component
import { useId, useMemo } from "react";
import { SingleValue } from "react-select";
import CreateableSelect from "react-select/creatable";

import { cn } from "@/lib/utils";

type Option = { label: string; value: string };

type Props = {
    onChange: (value?: string) => void;
    onCreate?: (value: string) => void | Promise<void>;
    options?: Option[];
    value?: string | null | undefined;
    disabled?: boolean;
    placeholder?: string;
    invalid?: boolean;
    isClearable?: boolean;
    id?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
};

export const Select = ({
    value,
    onChange,
    disabled,
    onCreate,
    options = [],
    placeholder,
    invalid,
    isClearable,
    id,
    ...aria
}: Props) => {
    // Stable id keeps react-select's generated ids identical on server and client.
    const instanceId = useId();

    const onSelect = (
        option: SingleValue<Option>
    ) => {
        onChange(option?.value);
    };

    // `null` (not undefined) clears the control when the value is reset.
    const formattedValue = useMemo(() => {
        return options.find((option) => option.value === value) ?? null;
    }, [options, value]);

    return (
        <CreateableSelect<Option, false>
            instanceId={instanceId}
            inputId={id}
            aria-invalid={invalid || aria["aria-invalid"]}
            aria-describedby={aria["aria-describedby"]}
            placeholder={placeholder}
            unstyled
            classNames={{
                control: ({ isFocused, isDisabled }) => cn(
                    "min-h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs transition-[color,box-shadow] dark:bg-input/30",
                    isFocused ? "border-ring ring-[3px] ring-ring/50" : "border-input",
                    invalid && "border-destructive ring-destructive/20",
                    isDisabled && "opacity-50 cursor-not-allowed",
                ),
                placeholder: () => "text-muted-foreground",
                input: () => "text-foreground",
                singleValue: () => "text-foreground",
                indicatorsContainer: () => "gap-1 text-muted-foreground",
                clearIndicator: () => "p-1 rounded hover:text-foreground",
                dropdownIndicator: () => "p-1 hover:text-foreground",
                indicatorSeparator: () => "hidden",
                menu: () => "mt-1 rounded-md border bg-popover text-popover-foreground shadow-md overflow-hidden",
                menuList: () => "p-1",
                option: ({ isFocused, isSelected }) => cn(
                    "rounded-sm px-2 py-1.5 text-sm cursor-default",
                    isFocused && "bg-accent text-accent-foreground",
                    isSelected && "font-medium text-primary",
                ),
                noOptionsMessage: () => "px-2 py-1.5 text-sm text-muted-foreground",
            }}
            value={formattedValue}
            onChange={onSelect}
            options={options}
            onCreateOption={onCreate}
            formatCreateLabel={(input) => `Create "${input.trim()}"`}
            isValidNewOption={(input) => {
                const name = input.trim().toLowerCase();
                return name.length > 0 && !options.some((option) => option.label.toLowerCase() === name);
            }}
            isDisabled={disabled}
            isClearable={isClearable}
        />
    );
};
