"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { isActiveRoute, NAV_ROUTES } from "@/lib/navigation";

type Props = {
    onNavigate?: () => void;
};

export const NavLinks = ({ onNavigate }: Props) => {
    const pathname = usePathname();

    return (
        <nav aria-label="Main" className="flex flex-col gap-1">
            {NAV_ROUTES.map(({ href, label, icon: Icon }) => {
                const active = isActiveRoute(pathname, href);

                return (
                    <Link
                        key={href}
                        href={href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                            "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors outline-none",
                            "focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/50",
                            active
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                        )}
                    >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
};
