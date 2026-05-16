import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HandoverFormProps {
  open: boolean;
  onClose: () => void;
}

export default function HandoverForm({ open, onClose }: HandoverFormProps) {
  const [fromShift, setFromShift] = useState<"early" | "late" | "night">("early");
const [toShift, setToShift] = useState<"early" | "late" | "night">("late");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const createHandover = trpc.handover.create.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setNotes("");
      }, 2000);
    },
    onError: (err: any) => setError(err.message),
  });

  const handleSubmit = () => {
    if (!notes.trim()) return;
    setError("");
    createHandover.mutate({
      fromShift,
      toShift,
      date: new Date().toISOString().split("T")[0],
      notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-xl">Schichtübergabe schreiben</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="dark:text-gray-300">Von Schicht</Label>
              <Select value={fromShift} onValueChange={(val) => setFromShift(val as "early" | "late" | "night")}>
                <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:text-gray-100">
                  <SelectItem value="early">Früh</SelectItem>
                  <SelectItem value="late">Spät</SelectItem>
                  <SelectItem value="night">Nacht</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="dark:text-gray-300">An Schicht</Label>
              <Select value={toShift} onValueChange={(val) => setToShift(val as "early" | "late" | "night")}>
                <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:text-gray-100">
                  <SelectItem value="early">Früh</SelectItem>
                  <SelectItem value="late">Spät</SelectItem>
                  <SelectItem value="night">Nacht</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="dark:text-gray-300">Notizen / Übergabeinformationen</Label>
            <Input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z. B. Maschine 3 hat ungewöhnliche Geräusche"
              className="dark:bg-gray-700 dark:text-gray-100"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && (
            <p className="text-green-600 dark:text-green-400 text-sm">
              Übergabe erfolgreich gespeichert!
            </p>
          )}

          <Button
            className="w-full"
            disabled={!notes.trim() || createHandover.isPending}
            onClick={handleSubmit}
          >
            {createHandover.isPending ? "Speichere..." : "Übergabe speichern"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}