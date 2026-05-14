import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const STATUS_OPTIONS = [
  { value: "active", label: "Aktiv" },
  { value: "inactive", label: "Inaktiv" },
  { value: "maintenance", label: "Wartung" },
  { value: "error", label: "Fehler" },
];

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  maintenance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabels = Object.fromEntries(STATUS_OPTIONS.map(o => [o.value, o.label]));

export default function Machines() {
  const { data: machines, refetch } = trpc.machine.list.useQuery();
  const updateStatus = trpc.machine.updateStatus.useMutation({ onSuccess: () => refetch() });
  const createMachine = trpc.machine.create.useMutation({ onSuccess: () => refetch() });
  const deleteMachine = trpc.machine.delete.useMutation({ onSuccess: () => refetch() });

  const [newMachine, setNewMachine] = useState({ name: "", serialNumber: "", location: "", status: "active" });
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMachine.mutate({
      name: newMachine.name,
      serialNumber: newMachine.serialNumber,
      location: newMachine.location,
    }, {
      onSuccess: () => {
        setNewMachine({ name: "", serialNumber: "", location: "", status: "active" });
        setDialogOpen(false);
      }
    });
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-gray-100">Maschinen</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full h-10 w-10">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:text-gray-100">
            <DialogHeader>
              <DialogTitle>Neue Maschine anlegen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                placeholder="Name"
                value={newMachine.name}
                onChange={e => setNewMachine({ ...newMachine, name: e.target.value })}
                required
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
              <Input
                placeholder="Seriennummer"
                value={newMachine.serialNumber}
                onChange={e => setNewMachine({ ...newMachine, serialNumber: e.target.value })}
                required
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
              <Input
                placeholder="Standort (optional)"
                value={newMachine.location}
                onChange={e => setNewMachine({ ...newMachine, location: e.target.value })}
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
              <Select value={newMachine.status} onValueChange={(val) => setNewMachine({ ...newMachine, status: val })}>
                <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:text-gray-100">
                  {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full" disabled={createMachine.isPending}>
                {createMachine.isPending ? "Speichern..." : "Anlegen"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {machines?.map((m) => (
          <Card key={m.id} className="bg-white/70 backdrop-blur-md shadow-xl rounded-3xl border-0 dark:bg-gray-800/70 dark:text-gray-100 dark:shadow-gray-900/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span>{m.name}</span>
                <Badge className={statusColors[m.status]}>{statusLabels[m.status]}</Badge>
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">SN: {m.serialNumber}</p>
              {m.location && <p className="text-sm text-gray-500 dark:text-gray-400">Standort: {m.location}</p>}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Select defaultValue={m.status} onValueChange={(val) => updateStatus.mutate({ id: m.id, status: val as any })}>
                  <SelectTrigger className="w-36 dark:bg-gray-700 dark:text-gray-100">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:text-gray-100">
                    {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="destructive" size="sm" onClick={() => deleteMachine.mutate({ id: m.id })}>
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