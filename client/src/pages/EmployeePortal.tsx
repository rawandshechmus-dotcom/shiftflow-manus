import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { useState } from "react";

const SHIFT_NAMES: Record<string, string> = { early: "Früh", late: "Spät", night: "Nacht" };

export default function EmployeePortal() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data, isLoading } = trpc.employee.me.useQuery(undefined, {
    refetchInterval: 10_000,   // Alle 10 Sekunden automatisch neu laden
    staleTime: 0,              // Daten sofort als veraltet markieren
    refetchOnMount: true,      // Bei jedem Mount neu laden
    refetchOnWindowFocus: true,// Bei Fenster-Fokus neu laden
  });

  if (isLoading) return <div className="p-8 dark:text-gray-100">Lade…</div>;
  if (!data) return <div className="p-8 dark:text-gray-100">Keine Mitarbeiterdaten gefunden.</div>;

  const me = (data as any)?.json ?? data;
  const shifts = me?.shifts ?? [];
  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <h1 className="text-2xl font-bold mb-4 dark:text-gray-100">
        Schichtplan für {me.firstName} {me.lastName}
      </h1>
      <p className="mb-4 dark:text-gray-300">Personal‑Nr.: {me.personnelNumber}</p>

      <div className="grid grid-cols-7 gap-1">
        {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d => (
          <div key={d} className="text-center font-bold p-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded">{d}</div>
        ))}
        {days.map(day => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayAssignments = shifts.filter((s: any) => s.shiftDate === dateStr);
          return (
            <Card key={dateStr} className="min-h-[80px] p-1 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl">
              <div className="text-sm font-semibold dark:text-gray-200">{format(day, "d")}</div>
              {dayAssignments.map((s: any) => (
                <div key={s.id} className="text-xs bg-indigo-100 dark:bg-indigo-900/50 dark:text-gray-200 rounded p-1 mt-1">
                  {SHIFT_NAMES[s.shiftType] || s.shiftType}
                </div>
              ))}
            </Card>
          );
        })}
      </div>
    </div>
  );
}