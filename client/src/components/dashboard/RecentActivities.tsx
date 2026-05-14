import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Info, Wrench } from "lucide-react";

const typeIcons: Record<string, any> = {
  error: AlertTriangle,
  warning: Wrench,
  success: CheckCircle,
  info: Info,
};

const typeColors: Record<string, string> = {
  error: "text-red-500 dark:text-red-400",
  warning: "text-amber-500 dark:text-amber-400",
  success: "text-emerald-500 dark:text-emerald-400",
  info: "text-blue-500 dark:text-blue-400",
};

export default function RecentActivities() {
  const { data: rawData, isLoading } = trpc.dashboard.recentActivities.useQuery();

  // Daten normalisieren: Entweder direkt ein Array oder in { json: [...] } verpackt
  const items = Array.isArray(rawData) ? rawData : (rawData as any)?.json ?? [];

  if (isLoading || !items || items.length === 0) {
    return (
      <Card className="glass-card rounded-2xl p-5 dark:bg-gray-800/70 dark:text-gray-100">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="glass-card rounded-2xl p-5 dark:bg-gray-800/70 dark:text-gray-100">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight dark:text-gray-200">
              Letzte Aktivitäten
            </h3>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              Aktionen und Statusänderungen
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {items.map((activity: any, idx: number) => {
            const Icon = typeIcons[activity.type] || Info;
            const color = typeColors[activity.type] || "text-blue-500";
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="mt-0.5">
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground dark:text-gray-200">
                    {activity.text}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">
                    {activity.time}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}