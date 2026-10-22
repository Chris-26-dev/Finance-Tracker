import { DataCharts } from "@/components/data-charts";
import { DataGrid } from "@/components/data-grid";
import { WelcomeMsg } from "@/components/welcome-msg";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <WelcomeMsg />
      <DataGrid />
      <DataCharts />
    </div>
  );
};
