import CurrencyInput from "react-currency-input-field";
import { Info, MinusCircle, PlusCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
 } from "@/components/ui/tooltip";

 type Props = {
    value: string;
    onChange: (value: string | undefined) => void;
    onBlur?: () => void;
    name?: string;
    placeholder?: string;
    disabled?: boolean;
    id?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
 };

 export const AmountInput =({
    value,
    onChange,
    onBlur,
    name,
    placeholder,
    disabled,
    id,
    ...aria
 }: Props) => {
    const parsedValue = parseFloat(value);
    const isIncome = parsedValue > 0;
    const isExpense = parsedValue < 0;

    const onReverseValue = () => {
        if (!value) return;

        const newValue = parseFloat(value) * -1;
        onChange(newValue.toString());
    };

    return (
        <div className="relative">
            <TooltipProvider>
                <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            onClick={onReverseValue}
                            disabled={disabled}
                            aria-label={isExpense ? "Switch to income" : isIncome ? "Switch to expense" : "Toggle income or expense"}
                            className={cn(
                                "absolute left-1.5 top-1.5 flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50",
                                isIncome && "bg-success text-background hover:bg-success/90",
                                isExpense && "bg-destructive text-background hover:bg-destructive/90",
                            )}
                        >
                            {!parsedValue && <Info className="size-3.5"/>}
                            {isIncome && <PlusCircle className="size-3.5"/>}
                            {isExpense && <MinusCircle className="size-3.5"/>}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        Use [+] for income and [-] for expenses
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <CurrencyInput
                id={id}
                name={name}
                aria-describedby={aria["aria-describedby"]}
                aria-invalid={aria["aria-invalid"]}
                inputMode="decimal"
                className="pl-10 placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm tabular-nums focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                placeholder={placeholder}
                value={value}
                decimalsLimit={2}
                allowNegativeValue
                onValueChange={onChange}
                onBlur={onBlur}
                disabled={disabled}
            />
            <p className="text-xs text-muted-foreground mt-2" aria-live="polite">
                {isIncome && "This will count as income"}
                {isExpense && "This will count as an expense"}
            </p>
        </div>
    )
 }
