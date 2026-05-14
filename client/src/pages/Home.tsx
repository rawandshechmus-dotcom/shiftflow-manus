import KpiCards from "@/components/dashboard/KpiCards";
import ActiveIssues from "@/components/dashboard/ActiveIssues";
import RecentActivities from "@/components/dashboard/RecentActivities";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="relative z-10 p-4 lg:p-6 max-w-[1440px] mx-auto space-y-5">
        <section>
          <KpiCards />
        </section>
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ActiveIssues />
          <RecentActivities />
        </section>
      </main>
    </div>
  );
}