import {
    ArrowLeftRight,
    LayoutDashboard,
    LucideIcon,
    Settings,
    Tags,
    Wallet,
} from "lucide-react";

export type NavRoute = {
    href: string;
    label: string;
    icon: LucideIcon;
    /** Whether the account/date filters affect this page. */
    showFilters?: boolean;
};

export const NAV_ROUTES: NavRoute[] = [
    { href: "/", label: "Overview", icon: LayoutDashboard, showFilters: true },
    { href: "/transactions", label: "Transactions", icon: ArrowLeftRight, showFilters: true },
    { href: "/accounts", label: "Accounts", icon: Wallet },
    { href: "/categories", label: "Categories", icon: Tags },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function isActiveRoute(pathname: string, href: string) {
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function getActiveRoute(pathname: string) {
    return NAV_ROUTES.find((route) => isActiveRoute(pathname, route.href));
}
