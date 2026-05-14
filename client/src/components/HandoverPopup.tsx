import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { useState } from "react";

interface HandoverPopupProps {
  open: boolean;
  onClose: () => void;
}

export default function HandoverPopup({ open, onClose }: HandoverPopupProps) {
  const [dismissed, setDismissed] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const { data: openHandovers, isLoading } = (trpc as any).handover.openForCurrentShift.useQuery(
    { shiftType: "early", date: today },
    { enabled: open && !dismissed }
  );

  const completeMutation = (trpc as any).handover.complete.useMutation();

  const handleComplete = async (id: number) => {
    await completeMutation.mutateAsync({ id });
    onClose();
  };

  if (!open || dismissed || (!isLoading && (!openHandovers || openHandovers.length === 0))) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-white/90 dark:bg-gray-800/90 shadow-2xl rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-bold dark:text-gray-100">Schichtübergabe</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => { setDismissed(true); onClose(); }}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="dark:text-gray-300">Lade Übergaben…</p>
          ) : openHandovers && openHandovers.length > 0 ? (
            <ul className="space-y-3">
              {openHandovers.map((h: any) => (
                <li key={h.id} className="border dark:border-gray-600 rounded-lg p-3">
                  <p className="text-sm font-medium dark:text-gray-200">Von: {h.fromShift} → An: {h.toShift}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{h.notes || "Keine Notizen"}</p>
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => handleComplete(h.id)}
                    disabled={completeMutation.isPending}
                  >
                    Quittieren
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Keine offenen Übergaben.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}