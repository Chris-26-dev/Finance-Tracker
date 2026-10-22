import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";

type Props = {
    children: React.ReactNode;
};

const DashboardLayout = ({ children }: Props) => {
    return (
        <div className="min-h-screen">
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
            >
                Skip to content
            </a>
            <AppSidebar />
            <div className="flex min-h-screen flex-col lg:pl-60">
                <Topbar />
                <main id="main" className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
                    <div className="mx-auto w-full max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
