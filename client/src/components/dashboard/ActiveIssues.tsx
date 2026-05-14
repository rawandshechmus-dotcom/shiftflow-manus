import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { AlertTriangle, Info, Wrench } from "lucide-react";

const severityConfig = {
  error: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50", border: "border-red-200", darkColor: "dark:text-red-400", darkBg: "dark:bg-red-900/20", darkBorder: "dark:border-red-800" },
  warning: { icon: Wrench, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200", darkColor: "dark:text-amber-400", darkBg: "dark:bg-amber-900/20", darkBorder: "dark:border-amber-800" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200", darkColor: "dark:text-blue-400", darkBg: "dark:bg-blue-900/20", darkBorder: "dark:border-blue-800" },
};

export default function ActiveIssues() {
  const { data: rawData, isLoading } = trpc.dashboard.activeIssues.useQuery();

  // Daten normalisieren: Falls die Antwort in { json: [...] } verpackt ist, entpacken wir sie
  const items = Array.isArray(rawData) ? rawData : (rawData as any)?.json ?? [];

  if (isLoading || !items || items.length === 0) {
    return (
      <Card className="glass-card rounded-2xl p-5 dark:bg-gray-800/70 dark:text-gray-100">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
      <Card className="glass-card rounded-2xl p-5 dark:bg-gray-800/70 dark:text-gray-100">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight dark:text-gray-200">Aktive Probleme</h3>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Maschinen & Personal</p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
            {items.length} offen
          </span>
        </div>
        <div className="space-y-3">
          {items.map((issue: any, idx: number) => {
            const config = severityConfig[issue.severity as keyof typeof severityConfig] ?? severityConfig.info;
            const Icon = config.icon;
            return (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className={`flex items-start gap-3 p-3 rounded-xl border ${config.border} ${config.bg} ${config.darkBorder} ${config.darkBg} hover:shadow-md transition-shadow cursor-default`}
              >
                <div className={`h-8 w-8 rounded-lg ${config.bg} ${config.darkBg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className={`h-4 w-4 ${config.color} ${config.darkColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug dark:text-gray-200">{issue.title}</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">{issue.since}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}