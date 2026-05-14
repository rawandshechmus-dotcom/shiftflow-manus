import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, string> = {
  present: "Anwesend",
  sick: "Krank",
  vacation: "Urlaub",
  absent: "Unentschuldigt",
};

const statusColors: Record<string, string> = {
  present: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  sick: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  vacation: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  absent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function EmployeePortal() {
  const { data, isLoading } = trpc.employee.me.useQuery(undefined, {
    refetchInterval: 30000, // Live‑Polling alle 30 Sekunden
  });

  if (isLoading) return <p className="p-8 dark:text-gray-100">Lade deine Daten…</p>;
  if (!data) return <p className="p-8 dark:text-gray-100">Keine Mitarbeiterdaten gefunden.</p>;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <h1 className="text-2xl font-bold mb-6 dark:text-gray-100">Mitarbeiter‑Portal</h1>

      <Card className="mb-8 bg-white/70 backdrop-blur-md shadow-xl rounded-3xl border-0 dark:bg-gray-800/70 dark:text-gray-100">
        <CardHeader>
          <CardTitle className="text-lg">{data.firstName} {data.lastName}</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">Personal‑Nr.: {data.personnelNumber}</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="font-medium">Status:</span>
            <Badge className={statusColors[data.status]}>{statusLabels[data.status]}</Badge>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Deine Schichten</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.shifts.map((shift: any) => (
          <Card key={shift.id} className="bg-white/70 backdrop-blur-md shadow-xl rounded-3xl border-0 dark:bg-gray-800/70 dark:text-gray-100">
            <CardHeader>
              <CardTitle className="text-md">{shift.shiftType}</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">{shift.shiftDate}</p>
            </CardHeader>
          </Card>
        ))}
        {data.shifts.length === 0 && (
          <p className="dark:text-gray-400">Keine Schichten in den nächsten 7 Tagen.</p>
        )}
      </div>
    </div>
  );
}