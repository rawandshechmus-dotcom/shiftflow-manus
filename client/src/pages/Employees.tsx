import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

const TEAMS = ["Management", "Produktion", "Logistik", "IT", "HR"];

const statusColors: Record<string, string> = {
  present: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  sick: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  vacation: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  absent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  present: "Anwesend",
  sick: "Krank",
  vacation: "Urlaub",
  absent: "Unentschuldigt",
};

export default function Employees() {
  const { data: employees, refetch } = trpc.employee.list.useQuery();
  const updateStatus = trpc.employee.updateStatus.useMutation({ onSuccess: () => refetch() });
  const createEmployee = trpc.employee.create.useMutation({ onSuccess: () => refetch() });
  const deleteEmployee = trpc.employee.delete.useMutation({ onSuccess: () => refetch() });

  const [newEmployee, setNewEmployee] = useState({ firstName: "", lastName: "", personnelNumber: "", team: "" });
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createEmployee.mutate(newEmployee, {
      onSuccess: () => {
        setNewEmployee({ firstName: "", lastName: "", personnelNumber: "", team: "" });
        setDialogOpen(false);
      }
    });
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-gray-100">Mitarbeiter</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full h-10 w-10">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:text-gray-100">
            <DialogHeader>
              <DialogTitle>Neuen Mitarbeiter anlegen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                placeholder="Vorname"
                value={newEmployee.firstName}
                onChange={e => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                required
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
              <Input
                placeholder="Nachname"
                value={newEmployee.lastName}
                onChange={e => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                required
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
              <Input
                placeholder="Personalnummer"
                value={newEmployee.personnelNumber}
                onChange={e => setNewEmployee({ ...newEmployee, personnelNumber: e.target.value })}
                required
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
              <Select value={newEmployee.team} onValueChange={(val) => setNewEmployee({ ...newEmployee, team: val })}>
                <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                  <SelectValue placeholder="Team wählen" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:text-gray-100">
                  {TEAMS.map(team => <SelectItem key={team} value={team}>{team}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full" disabled={createEmployee.isPending}>
                {createEmployee.isPending ? "Speichern..." : "Anlegen"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees?.map((emp) => (
          <Card key={emp.id} className="bg-white/70 backdrop-blur-md shadow-xl rounded-3xl border-0 dark:bg-gray-800/70 dark:text-gray-100 dark:shadow-gray-900/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{emp.firstName[0]}{emp.lastName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{emp.firstName} {emp.lastName}</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{emp.personnelNumber}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge className={statusColors[emp.status]}>{statusLabels[emp.status]}</Badge>
                <Select defaultValue={emp.status} onValueChange={(val) => updateStatus.mutate({ id: emp.id, status: val as any })}>
                  <SelectTrigger className="w-36 dark:bg-gray-700 dark:text-gray-100">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:text-gray-100">
                    <SelectItem value="present">Anwesend</SelectItem>
                    <SelectItem value="sick">Krank</SelectItem>
                    <SelectItem value="vacation">Urlaub</SelectItem>
                    <SelectItem value="absent">Unentschuldigt</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="destructive" size="sm" onClick={() => deleteEmployee.mutate({ id: emp.id })}>
                  Löschen
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}