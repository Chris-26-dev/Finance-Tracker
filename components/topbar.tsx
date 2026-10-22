"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { ClerkLoaded, ClerkLoading, UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Filters } from "@/components/filters";
import { Logo } from "@/components/logo";
import { NavLinks } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { getActiveRoute } from "@/lib/navigation";

export const Topbar = () => {
    const pathname = usePathname();
    const route = getActiveRoute(pathname);
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <div className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 lg:px-8">
                <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" aria-label="Open navigation">
                            <Menu className="size-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 gap-0 bg-sidebar p-0">
                        <SheetHeader className="h-14 justify-center px-5">
                            <SheetTitle className="sr-only">Navigation</SheetTitle>
                            <SheetDescription className="sr-only">Go to a section of the app</SheetDescription>
                            <Logo />
                        </SheetHeader>
                        <div className="px-3 py-4">
                            <NavLinks onNavigate={() => setMenuOpen(false)} />
                        </div>
                    </SheetContent>
                </Sheet>

                <h1 className="order-1 truncate text-lg font-semibold tracking-tight">
                    {route?.label ?? "Finance"}
                </h1>

                <div className="order-2 ml-auto flex items-center gap-1 md:order-3 md:ml-0">
                    <ThemeToggle />
                    <div className="flex size-9 items-center justify-center">
                        <ClerkLoaded>
                            <UserButton />
                        </ClerkLoaded>
                        <ClerkLoading>
                            <Skeleton className="size-7 rounded-full" />
                        </ClerkLoading>
                    </div>
                </div>

                {route?.showFilters && (
                    <div className="order-3 w-full md:order-2 md:ml-auto md:w-auto">
                        <Suspense fallback={<Skeleton className="h-9 w-full md:w-80" />}>
                            <Filters />
                        </Suspense>
                    </div>
                )}
            </div>
        </header>
    );
};
