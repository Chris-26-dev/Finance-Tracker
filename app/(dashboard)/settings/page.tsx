"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useTheme } from "next-themes";
import { useMountedState } from "react-use";
import { useClerk, useUser } from "@clerk/nextjs";
import { Download, Loader2, Trash, UserRound } from "lucide-react";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { handleResponse } from "@/lib/api-response";
import { downloadCsv, toCsv } from "@/lib/csv-export";
import {
    cn,
    convertAmountFromMiliunits,
    DELETE_DATA_CONFIRMATION,
    formatCurrency,
    SUPPORTED_CURRENCIES,
    toDayKey,
} from "@/lib/utils";
import { useCurrency } from "@/hooks/use-currency";
import { useDeleteUserData } from "@/features/user-data/api/use-delete-user-data";
import { THEME_OPTIONS } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const AppearanceSection = () => {
    const { theme, setTheme } = useTheme();
    // The saved theme is only known on the client.
    const isMounted = useMountedState();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Appearance</CardTitle>
                <CardDescription>
                    Choose a theme. &ldquo;System&rdquo; follows your device setting. Saved in this browser.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <fieldset>
                    <legend className="sr-only">Theme</legend>
                    <div className="grid grid-cols-3 gap-2 sm:max-w-md">
                        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                            const checked = isMounted() && theme === value;
                            return (
                                <label
                                    key={value}
                                    className={cn(
                                        "flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors",
                                        "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                                        checked ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted/50",
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="theme"
                                        value={value}
                                        checked={checked}
                                        onChange={() => setTheme(value)}
                                        className="sr-only"
                                    />
                                    <Icon className="size-5" aria-hidden />
                                    {label}
                                </label>
                            );
                        })}
                    </div>
                </fieldset>
            </CardContent>
        </Card>
    );
};

const CurrencySection = () => {
    const { user, isLoaded } = useUser();
    const currency = useCurrency();
    const [saving, setSaving] = useState(false);

    const onChange = async (code: string) => {
        if (!user) return;
        setSaving(true);
        try {
            await user.update({
                unsafeMetadata: { ...user.unsafeMetadata, currency: code },
            });
            toast.success("Currency updated");
        } catch {
            toast.error("Couldn't save your currency", { description: "Please try again." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Currency</CardTitle>
                <CardDescription>
                    How amounts are displayed. Amounts are not converted between currencies.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="space-y-2">
                    <Label htmlFor="currency">Display currency</Label>
                    <Select value={currency} onValueChange={onChange} disabled={!isLoaded || saving}>
                        <SelectTrigger id="currency" className="w-full sm:w-64">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SUPPORTED_CURRENCIES.map((option) => (
                                <SelectItem key={option.code} value={option.code}>
                                    {option.code} · {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <p className="flex h-9 items-center gap-2 text-sm text-muted-foreground">
                    {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
                    Preview: <span className="font-medium text-foreground tabular-nums">{formatCurrency(-1234.5, currency)}</span>
                </p>
            </CardContent>
        </Card>
    );
};

const ProfileSection = () => {
    const { user, isLoaded } = useUser();
    const clerk = useClerk();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Profile</CardTitle>
                <CardDescription>Your sign-in details are managed by your account provider.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {isLoaded && user ? (
                    <div className="flex min-w-0 items-center gap-3">
                        {user.hasImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.imageUrl} alt="" className="size-10 rounded-full" />
                        ) : (
                            <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                                <UserRound className="size-5 text-muted-foreground" aria-hidden />
                            </span>
                        )}
                        <div className="min-w-0">
                            <p className="truncate font-medium">{user.fullName || user.username || "Your account"}</p>
                            <p className="truncate text-sm text-muted-foreground">
                                {user.primaryEmailAddress?.emailAddress}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-44" />
                        </div>
                    </div>
                )}
                <Button variant="outline" onClick={() => clerk.openUserProfile()} disabled={!isLoaded}>
                    Manage account
                </Button>
            </CardContent>
        </Card>
    );
};

const DataSection = () => {
    const [exporting, setExporting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [confirmation, setConfirmation] = useState("");
    const deleteMutation = useDeleteUserData();

    const onExport = async () => {
        setExporting(true);
        try {
            const response = await client.api.transactions.$get({
                query: { from: "1900-01-01", to: "2100-12-31" },
            });
            const { data } = await handleResponse(response);

            const csv = toCsv(
                ["Date", "Payee", "Amount", "Category", "Account", "Notes"],
                data.map((transaction) => [
                    toDayKey(new Date(transaction.date)),
                    transaction.payee,
                    convertAmountFromMiliunits(transaction.amount),
                    transaction.category,
                    transaction.account,
                    transaction.notes,
                ]),
            );

            downloadCsv(`transactions-${format(new Date(), "yyyy-MM-dd")}.csv`, csv);
            toast.success(`Exported ${data.length} transaction${data.length === 1 ? "" : "s"}`);
        } catch (error) {
            toast.error("Export failed", { description: error instanceof Error ? error.message : undefined });
        } finally {
            setExporting(false);
        }
    };

    const onOpenChange = (open: boolean) => {
        if (deleteMutation.isPending) return;
        setDialogOpen(open);
        setConfirmation("");
    };

    const onDelete = () => {
        deleteMutation.mutate(undefined, {
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Export data</CardTitle>
                    <CardDescription>
                        Download every transaction as a CSV file. It can be imported back into this app.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" onClick={onExport} disabled={exporting}>
                        {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                        Export CSV
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-destructive/40">
                <CardHeader>
                    <CardTitle className="text-base text-destructive">Delete all data</CardTitle>
                    <CardDescription>
                        Permanently delete all of your accounts, categories and transactions. Your sign-in account is not deleted. This can&apos;t be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive" onClick={() => onOpenChange(true)}>
                        <Trash className="size-4" />
                        Delete all data
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete all your data?</DialogTitle>
                        <DialogDescription>
                            Every account, category and transaction will be permanently deleted. Consider exporting a CSV first.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        className="space-y-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (confirmation === DELETE_DATA_CONFIRMATION) onDelete();
                        }}
                    >
                        <Label htmlFor="delete-confirmation">
                            Type <span className="font-mono font-semibold">{DELETE_DATA_CONFIRMATION}</span> to confirm
                        </Label>
                        <Input
                            id="delete-confirmation"
                            value={confirmation}
                            onChange={(event) => setConfirmation(event.target.value)}
                            autoComplete="off"
                            disabled={deleteMutation.isPending}
                        />
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={deleteMutation.isPending}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={confirmation !== DELETE_DATA_CONFIRMATION || deleteMutation.isPending}
                            >
                                {deleteMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                                Delete everything
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};

const SettingsPage = () => {
    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <AppearanceSection />
            <CurrencySection />
            <ProfileSection />
            <DataSection />
        </div>
    );
};

export default SettingsPage;
