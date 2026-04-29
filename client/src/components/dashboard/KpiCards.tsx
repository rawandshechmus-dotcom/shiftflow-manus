import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Users, Cog, Gauge, Timer, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const iconMap = {
  employees: Users,
  machines: Cog,
  efficiency: Gauge,
  shift: Timer,
};

const colorMap = {
  employees: { bg: "bg-blue-500/10", icon: "text-blue-600", glow: "glow-primary" },
  machines: { bg: "bg-emerald-500/10", icon: "text-emerald-600", glow: "glow-success" },
  efficiency: { bg: "bg-amber-500/10", icon: "text-amber-600", glow: "glow-warning" },
  shift: { bg: "bg-indigo-500/10", icon: "text-indigo-600", glow: "glow-primary" },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function KpiCards() {
  const { data, isLoading } = trpc.dashboard.kpis.useQuery();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6 h-32 animate-pulse bg-muted/50" />
        ))}
      </div>
    );
  }

  const items = [
    {
      key: "employees" as const,
      label: "Mitarbeiter",
      value: data.employees,
      sub: `+${data.employeeChange} heute`,
      trend: "up" as const,
    },
    {
      key: "machines" as const,
      label: "Aktive Maschinen",
      value: `${data.activeMachines}/${data.totalMachines}`,
      sub: "in Betrieb",
      trend: "neutral" as const,
    },
    {
      key: "efficiency" as const,
      label: "Effizienz",
      value: `${data.efficiency}%`,
      sub: "Durchschnitt",
      trend: "up" as const,
    },
    {
      key: "shift" as const,
      label: "Schichtauslastung",
      value: `${data.shiftUtilization}%`,
      sub: "Aktuelle Schicht",
      trend: "up" as const,
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {items.map((item) => {
        const Icon = iconMap[item.key];
        const colors = colorMap[item.key];
        return (
          <motion.div key={item.key} variants={cardVariants}>
            <Card
              className={`glass-card p-5 rounded-2xl hover:scale-[1.02] transition-transform duration-300 cursor-default group ${colors.glow}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`h-10 w-10 rounded-xl ${colors.bg} flex items-center justify-center`}
                >
                  <Icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
                {item.trend === "up" && (
                  <span className="flex items-center gap-0.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                    <TrendingUp className="h-3 w-3" />
                    gut
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {item.value}
                </p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                {item.sub}
              </p>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
