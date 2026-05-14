import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from "date-fns";

const SHIFT_TYPES = ["early", "late", "night"] as const;

export default function Schedule() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: employees } = trpc.employee.list.useQuery();
  const { data: machines } = trpc.machine.list.useQuery();
  const { data: assignments, refetch } = trpc.assignment.list.useQuery({
    year: currentMonth.getFullYear(),
    month: currentMonth.getMonth() + 1,
  });

  const createMutation = trpc.assignment.create.useMutation({ onSuccess: () => refetch() });
  const deleteMutation = trpc.assignment.delete.useMutation({ onSuccess: () => refetch() });

  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null);
  const [selectedShift, setSelectedShift] = useState<string | null>(null);

  const handleCreateAssignment = async (dateStr: string) => {
    if (selectedEmployee && selectedMachine && selectedShift) {
      await createMutation.mutateAsync({
        employeeId: selectedEmployee,
        machineId: selectedMachine,
        shiftDate: dateStr,
        shiftType: selectedShift as any,
      });
      setSelectedEmployee(null);
      setSelectedMachine(null);
      setSelectedShift(null);
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 dark:text-gray-100">Schichtplan</h1>
      <div className="flex items-center gap-4 mb-6">
        <Button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>←</Button>
        <span className="text-lg font-semibold dark:text-gray-200">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <Button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>→</Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => (
          <div key={d} className="text-center font-bold p-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded">
            {d}
          </div>
        ))}
        {days.map(day => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayAssignments = assignments?.filter((a: any) => a.assignments?.shiftDate === dateStr) ?? [];
          const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;

          return (
            <Card
              key={dateStr}
              className={`min-h-[140px] p-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl ${
                isToday ? "ring-2 ring-indigo-400" : ""
              }`}
            >
              <div className="text-sm font-semibold mb-1 dark:text-gray-200">{format(day, "d")}</div>

              {dayAssignments.map((a: any) => (
                <div
                  key={a.assignments.id}
                  className="text-xs bg-indigo-100 dark:bg-indigo-900/50 dark:text-gray-200 rounded p-1 mb-1 flex justify-between items-center"
                >
                  <span>
                    {a.employees?.firstName} {a.employees?.lastName} – {a.machines?.name} ({a.assignments.shiftType})
                  </span>
                  <button
                    onClick={() => deleteMutation.mutate({ id: a.assignments.id })}
                    className="text-red-500 hover:text-red-700 ml-1"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {dayAssignments.length === 0 && (
                <div className="mt-1 space-y-1">
                  <Select onValueChange={(val) => setSelectedEmployee(+val)}>
                    <SelectTrigger className="w-full text-xs h-8 dark:bg-gray-700 dark:text-gray-100">
                      <SelectValue placeholder="Mitarbeiter" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:text-gray-100">
                      {employees?.map(emp => (
                        <SelectItem key={emp.id} value={String(emp.id)}>
                          {emp.firstName} {emp.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select onValueChange={(val) => setSelectedMachine(+val)}>
                    <SelectTrigger className="w-full text-xs h-8 dark:bg-gray-700 dark:text-gray-100">
                      <SelectValue placeholder="Maschine" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:text-gray-100">
                      {machines?.map(m => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select onValueChange={setSelectedShift}>
                    <SelectTrigger className="w-full text-xs h-8 dark:bg-gray-700 dark:text-gray-100">
                      <SelectValue placeholder="Schicht" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:text-gray-100">
                      {SHIFT_TYPES.map(st => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    className="w-full mt-1"
                    disabled={!selectedEmployee || !selectedMachine || !selectedShift}
                    onClick={() => handleCreateAssignment(dateStr)}
                  >
                    Speichern
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}