import { z } from "zod";
import { Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/date-picker";
import { AmountInput } from "@/components/amount-input";
import {
    insertTransactionSchema,
    MAX_AMOUNT_MILIUNITS,
    MAX_NOTES_LENGTH,
    MAX_PAYEE_LENGTH,
} from "@/db/schema";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Select } from "@/components/select";
import { Textarea } from "@/components/ui/textarea";
import { convertAmountToMiliunits, toUtcCalendarDate } from "@/lib/utils";

const MAX_AMOUNT = MAX_AMOUNT_MILIUNITS / 1000;

export const formSchema = z.object({
    date: z.date({
        required_error: "Pick a date",
        invalid_type_error: "Pick a date",
    }),
    accountId: z.string().min(1, "Select an account"),
    categoryId: z.string().nullable().optional(),
    payee: z
        .string()
        .trim()
        .min(1, "Payee is required")
        .max(MAX_PAYEE_LENGTH, `Payee must be ${MAX_PAYEE_LENGTH} characters or fewer`),
    amount: z
        .string()
        .trim()
        .min(1, "Amount is required")
        .refine((value) => Number.isFinite(Number(value)), "Enter a valid amount")
        .refine((value) => Number(value) !== 0, "Amount cannot be zero")
        .refine(
            (value) => Math.abs(Number(value)) <= MAX_AMOUNT,
            `Amount must be at most ${MAX_AMOUNT.toLocaleString("en-US")}`,
        ),
    notes: z
        .string()
        .max(MAX_NOTES_LENGTH, `Notes must be ${MAX_NOTES_LENGTH} characters or fewer`)
        .nullable()
        .optional(),
});

const apiSchema = insertTransactionSchema.omit({
    id: true,
});

type FormValues = z.input<typeof formSchema>;
type ApiFormValues = z.input<typeof apiSchema>;

type Option = { label: string; value: string; };

type Props = {
    id?: string;
    defaultValues?: FormValues;
    onSubmit: (values: ApiFormValues) => void;
    onDelete?: () => void;
    disabled?: boolean;
    accountOptions: Option[];
    categoryOptions: Option[];
    // Resolve with the new record's id so it can be selected immediately.
    onCreateAccount: (name: string) => Promise<string | undefined>;
    onCreateCategory: (name: string) => Promise<string | undefined>;
};

export const TransactionForm = ({
    id,
    defaultValues,
    onSubmit,
    onDelete,
    disabled,
    accountOptions,
    categoryOptions,
    onCreateAccount,
    onCreateCategory
}: Props) => {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            date: new Date(),
            accountId: "",
            categoryId: null,
            payee: "",
            amount: "",
            notes: "",
            ...defaultValues, // override with passed-in props
        },
    });

    const handleSubmit = (values: FormValues) => {
        const amountInMiliunits = convertAmountToMiliunits(Number(values.amount));
        const notes = values.notes?.trim();

        onSubmit({
            ...values,
            payee: values.payee.trim(),
            categoryId: values.categoryId || null,
            notes: notes ? notes : null,
            date: toUtcCalendarDate(values.date),
            amount: amountInMiliunits,
        });
    };

    const handleDelete = () => {
        onDelete?.();
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4 px-4 pb-6"
                noValidate>
                <FormField
                    name="date"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Date
                            </FormLabel>
                            <FormControl>
                                <DatePicker
                                    value={field.value}
                                    onChange={field.onChange}
                                    disabled={disabled}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    name="accountId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <FormItem>
                            <FormLabel>
                                Account
                            </FormLabel>
                            <FormControl>
                                <Select
                                    placeholder="Select an account"
                                    options={accountOptions}
                                    onCreate={async (name) => {
                                        const createdId = await onCreateAccount(name);
                                        if (createdId) {
                                            field.onChange(createdId);
                                        }
                                    }}
                                    value={field.value}
                                    onChange={(value) => field.onChange(value ?? "")}
                                    disabled={disabled}
                                    invalid={!!fieldState.error}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    name="categoryId"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Category
                            </FormLabel>
                            <FormControl>
                                <Select
                                    placeholder="Select a category"
                                    options={categoryOptions}
                                    onCreate={async (name) => {
                                        const createdId = await onCreateCategory(name);
                                        if (createdId) {
                                            field.onChange(createdId);
                                        }
                                    }}
                                    value={field.value}
                                    onChange={(value) => field.onChange(value ?? null)}
                                    disabled={disabled}
                                    isClearable
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    name="payee"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Payee
                            </FormLabel>
                            <FormControl>
                                <Input
                                    disabled={disabled}
                                    placeholder="Add a payee"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    name="amount"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Amount
                            </FormLabel>
                            <FormControl>
                                <AmountInput
                                    {...field}
                                    onChange={(value) => field.onChange(value ?? "")}
                                    disabled={disabled}
                                    placeholder="0.00"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    name="notes"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Notes
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    value={field.value ?? ""}
                                    disabled={disabled}
                                    placeholder="Optional notes"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={disabled}>
                    {id ? "Save changes" : "Create transaction"}
                </Button>
                {!!id && (
                    <Button
                        type="button"
                        disabled={disabled}
                        onClick={handleDelete}
                        className="w-full text-destructive hover:text-destructive"
                        variant="outline"
                    >
                        <Trash className="size-4" />
                        Delete transaction
                    </Button>
                )}
            </form>
        </Form>
    )

}
