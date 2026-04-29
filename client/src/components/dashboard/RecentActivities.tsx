import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  CheckCircle,
  AlertCircle,
  Info,
  XCircle,
  Activity,
} from "lucide-react";

const typeConfig = {
  success: {
    icon: CheckCircle,
    color: "text-emerald-500",
    dot: "bg-emerald-500",
  },
  warning: {
    icon: AlertCircle,
    color: "text-amber-500",
    dot: "bg-amber-500",
  },
  error: {
    icon: XCircle,
    color: "text-red-500",
    dot: "bg-red-500",
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    dot: "bg-blue-500",
  },
};

export default function RecentActivities() {
  const { data, isLoading } = trpc.dashboard.recentActivities.useQuery();

  if (isLoading || !data) {
    return (
      <Card className="glass-card rounded-2xl p-5">
        <Skeleton className="h-5 w-36 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
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
      <Card className="glass-card rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight">
              Letzte Aktivitäten
            </h3>
            <p className="text-xs text-muted-foreground">
              Logins & Statusänderungen
            </p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            Live
          </span>
        </div>
        <div className="relative space-y-4">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
          {data.map((activity, idx) => {
            const config =
              typeConfig[activity.type as keyof typeof typeConfig] ??
              typeConfig.info;
            const Icon = config.icon;
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + idx * 0.08 }}
                className="relative flex items-start gap-3 pl-1"
              >
                <div
                  className={`relative z-10 h-3 w-3 rounded-full ${config.dot} ring-2 ring-background shrink-0 mt-1.5`}
                />
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${config.color} shrink-0`} />
                    <p className="text-sm text-foreground leading-snug">
                      {activity.text}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap ml-2">
                    {activity.time}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}
