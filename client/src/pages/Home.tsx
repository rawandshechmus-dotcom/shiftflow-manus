import DashboardLayout from "@/components/DashboardLayout";
import TopNav from "@/components/dashboard/TopNav";
import KpiCards from "@/components/dashboard/KpiCards";
import EmployeeTrendChart from "@/components/dashboard/EmployeeTrendChart";
import MachinePerformanceChart from "@/components/dashboard/MachinePerformanceChart";
import ActiveIssues from "@/components/dashboard/ActiveIssues";
import RecentActivities from "@/components/dashboard/RecentActivities";

export default function Home() {
  return (
    <DashboardLayout>
      <div className="dashboard-bg min-h-screen">
        <TopNav />
        <main className="relative z-10 p-4 lg:p-6 max-w-[1440px] mx-auto space-y-5">
          {/* KPI Cards */}
          <section>
            <KpiCards />
          </section>

          {/* Charts */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EmployeeTrendChart />
            <MachinePerformanceChart />
          </section>

          {/* Bottom Section: Issues & Activities */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ActiveIssues />
            <RecentActivities />
          </section>
        </main>
      </div>
    </DashboardLayout>
  );
}
