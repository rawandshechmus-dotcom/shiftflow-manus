import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { data: notifications, refetch } = trpc.notification.list.useQuery();
  const markAsRead = trpc.notification.markAsRead.useMutation({ onSuccess: () => refetch() });
  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({ onSuccess: () => refetch() });

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold dark:text-gray-100">Alle Benachrichtigungen</h1>
          <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()}>Alle als gelesen</Button>
        </div>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-3">
            {notifications?.map((n: any) => (
              <Card key={n.id} className={cn("p-4 flex gap-3 items-start cursor-pointer", n.isRead ? "bg-background text-muted-foreground" : "bg-blue-50 dark:bg-blue-950/50 text-foreground border-blue-200")} onClick={() => !n.isRead && markAsRead.mutate(n.id)}>
                <Info className={n.isRead ? "text-muted-foreground" : "text-blue-600"} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {n.isRead && <CheckCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}