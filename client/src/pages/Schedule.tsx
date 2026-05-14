import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { User, Clock, Wrench } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const SHIFT_LABELS: Record<string, string> = { "Früh": "early", "Spät": "late", "Nacht": "night" };
const SHIFT_NAMES: Record<string, string> = { "early": "Früh", "late": "Spät", "night": "Nacht" };
const SHIFT_TYPES = ["Früh", "Spät", "Nacht"] as const;

const shiftColors: Record<string, string> = {
  Früh: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Spät: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  Nacht: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
};

export default function Schedule() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newEmployee, setNewEmployee] = useState<number | null>(null);
  const [newMachine, setNewMachine] = useState<number | null>(null);
  const [newShift, setNewShift] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0); 

  const { data: employees } = trpc.employee.list.useQuery();
  const { data: machines } = trpc.machine.list.useQuery();
  const { data: rawData } = trpc.assignment.list.useQuery({
    year: currentMonth.getFullYear(),
    month: currentMonth.getMonth() + 1,
  });

  
  const assignments = (rawData as any)?.json ?? rawData ?? [];

  const utils = trpc.useUtils();

  const createMutation = trpc.assignment.create.useMutation({
  onSuccess: () => {
    utils.assignment.list.invalidate();
    utils.employee.me.invalidate();
    utils.employee.me.refetch();     
  },
});
const deleteMutation = trpc.assignment.delete.useMutation({
  onSuccess: () => {
    utils.assignment.list.invalidate();
    utils.employee.me.invalidate();
    utils.employee.me.refetch();      
  },
});

  const handleCreate = async () => {
    if (newEmployee && newMachine && newShift && selectedDate) {
      const dbShiftType = SHIFT_LABELS[newShift];
      await createMutation.mutateAsync({
        employeeId: newEmployee,
        machineId: newMachine,
        shiftDate: selectedDate,
        shiftType: dbShiftType as "early" | "late" | "night",
      });
      
      setNewEmployee(null);
      setNewMachine(null);
      setNewShift(null);
      setFormKey(k => k + 1); 
    }
  };

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

  const dayAssignments = selectedDate
    ? (assignments ?? []).filter((a: any) => a && a.shiftDate === selectedDate)
        .map((a: any) => {
          const emp = employees?.find((e: any) => e.id === a.employeeId);
          const mac = machines?.find((m: any) => m.id === a.machineId);
          return { ...a, employeeName: emp ? `${emp.firstName} ${emp.lastName}` : `MA ${a.employeeId}`, machineName: mac ? mac.name : `Maschine ${a.machineId}` };
        })
    : [];

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 dark:text-gray-100">Schichtplan</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md shadow-xl rounded-3xl border-0 p-4">
            <div className="flex items-center justify-between mb-4">
              <Button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>←</Button>
              <span className="text-lg font-semibold dark:text-gray-200">{format(currentMonth, "MMMM yyyy")}</span>
              <Button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>→</Button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d => (
                <div key={d} className="text-center font-bold text-sm p-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded">{d}</div>
              ))}
              {days.map(day => {
                const dateStr = format(day, "yyyy-MM-dd");
                const hasAssignments = (assignments ?? []).some((a: any) => a.shiftDate === dateStr);
                const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;
                const isActive = selectedDate === dateStr;
                return (
                  <button key={dateStr} onClick={() => setSelectedDate(dateStr)}
                    className={`min-h-[60px] p-2 rounded-xl text-left transition-all hover:shadow-md
                      ${isActive ? "ring-2 ring-indigo-500 bg-indigo-50 dark:bg-gray-700" : "bg-white/50 dark:bg-gray-800/50"}
                      ${isToday ? "font-bold" : ""} ${hasAssignments ? "border-l-4 border-indigo-500" : ""}`}
                  >
                    <div className="text-sm dark:text-gray-200">{format(day, "d")}.</div>
                    {hasAssignments && <div className="flex mt-1 space-x-0.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><div className="w-2 h-2 rounded-full bg-purple-500" /><div className="w-2 h-2 rounded-full bg-indigo-500" /></div>}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div>
          {selectedDate ? (
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md shadow-xl rounded-3xl border-0 p-4 space-y-4">
              <h2 className="font-semibold text-lg dark:text-gray-200">{format(new Date(selectedDate), "dd.MM.yyyy")}</h2>
              {dayAssignments.length > 0 ? (
                dayAssignments.map((a: any) => {
                  const germanShiftName = SHIFT_NAMES[a.shiftType] || a.shiftType;
                  return (
                    <Card key={a.id} className="p-3 bg-gray-50 dark:bg-gray-900/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-500" /><span className="font-medium dark:text-gray-200">{a.employeeName}</span></div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1"><Wrench className="h-3 w-3" /> {a.machineName} <Clock className="h-3 w-3" /> <Badge className={shiftColors[germanShiftName]}>{germanShiftName}</Badge></div>
                        </div>
                        <button onClick={() => deleteMutation.mutate({ id: a.id })} className="text-red-500 hover:text-red-700 text-lg">✕</button>
                      </div>
                    </Card>
                  );
                })
              ) : <p className="text-gray-500 dark:text-gray-400">Keine Schichten an diesem Tag.</p>}

              <div className="pt-2 border-t dark:border-gray-600 space-y-2">
                <p className="text-sm font-medium dark:text-gray-300">Schicht hinzufügen</p>
                <Select key={`emp-${formKey}`} onValueChange={(val) => setNewEmployee(+val)}>
                  <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100"><SelectValue placeholder="Mitarbeiter wählen" /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:text-gray-100">{employees?.map(emp => <SelectItem key={emp.id} value={String(emp.id)}>{emp.firstName} {emp.lastName}</SelectItem>)}</SelectContent>
                </Select>
                <Select key={`mac-${formKey}`} onValueChange={(val) => setNewMachine(+val)}>
                  <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100"><SelectValue placeholder="Maschine wählen" /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:text-gray-100">{machines?.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select key={`shift-${formKey}`} onValueChange={setNewShift}>
                  <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100"><SelectValue placeholder="Schicht wählen" /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:text-gray-100">{SHIFT_TYPES.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
                </Select>
                <Button className="w-full" disabled={!newEmployee || !newMachine || !newShift} onClick={handleCreate}>Speichern</Button>
              </div>
            </Card>
          ) : <div className="text-center text-gray-500 dark:text-gray-400 py-12">Wähle einen Tag im Kalender aus</div>}
        </div>
      </div>
    </div>
  );
}