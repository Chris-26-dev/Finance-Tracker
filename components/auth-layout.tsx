import { Loader2, PieChart, ShieldCheck, Upload } from "lucide-react";
import { ClerkLoaded, ClerkLoading } from "@clerk/nextjs";

import { Logo } from "@/components/logo";

type Props = {
    title: string;
    description: string;
    children: React.ReactNode;
};

const FEATURES = [
    { icon: PieChart, text: "See income, spending and trends at a glance" },
    { icon: Upload, text: "Import transactions from your bank's CSV export" },
    { icon: ShieldCheck, text: "Your data is private to your account" },
];

export const AuthLayout = ({ title, description, children }: Props) => {
    return (
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
            <main className="flex flex-col px-4 py-8 sm:px-8">
                <Logo />
                <div className="flex flex-1 flex-col items-center justify-center gap-8 py-10">
                    <div className="space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    <ClerkLoaded>{children}</ClerkLoaded>
                    <ClerkLoading>
                        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
                    </ClerkLoading>
                </div>
            </main>
            <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-center lg:px-16">
                <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10" aria-hidden />
                <div className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-white/5" aria-hidden />
                <div className="relative max-w-md space-y-8">
                    <p className="text-3xl font-semibold leading-tight tracking-tight">
                        Know where every dollar goes.
                    </p>
                    <ul className="space-y-4">
                        {FEATURES.map(({ icon: Icon, text }) => (
                            <li key={text} className="flex items-center gap-3 text-primary-foreground/90">
                                <span className="flex size-9 items-center justify-center rounded-lg bg-white/15">
                                    <Icon className="size-4" aria-hidden />
                                </span>
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>
        </div>
    );
};
