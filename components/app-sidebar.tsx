import { Logo } from "@/components/logo";
import { NavLinks } from "@/components/nav-links";

export const AppSidebar = () => {
    return (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-sidebar text-sidebar-foreground lg:flex">
            <div className="flex h-14 items-center px-5">
                <Logo />
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
                <NavLinks />
            </div>
        </aside>
    );
};
