import React from "react";
import { trpc } from "@/lib/trpc";
import { Bell, Info, CheckCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function NotificationBell() {
  const utils = trpc.useUtils();

  const { data: rawNotifications } = trpc.notification.list.useQuery(undefined, {
    refetchInterval: 10000,
  });
  const { data: rawUnreadCount } = trpc.notification.unreadCount.useQuery(undefined, {
    refetchInterval: 10000,
  });

  // Normalisieren: Falls die Antwort in { json: [...] } verpackt ist, entpacken wir sie
  const notifications = Array.isArray(rawNotifications)
    ? rawNotifications
    : (rawNotifications as any)?.json ?? [];

  const unreadCount = typeof rawUnreadCount === 'number'
    ? rawUnreadCount
    : (rawUnreadCount as any)?.json ?? 0;

  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });

  const unreadNotifications = notifications.filter((n: any) => !n.isRead);

  const handleMarkAllAsRead = async () => {
    for (const n of unreadNotifications) {
      try { await markAsRead.mutateAsync( n.id ); } catch {}
    }
    utils.notification.list.invalidate();
    utils.notification.unreadCount.invalidate();
  };

  const handleViewAll = () => {
    window.location.href = "/alle-benachrichtigungen";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-lg">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4 pb-2 font-medium">
          Benachrichtigungen ({unreadCount})
        </div>
        <ScrollArea className="h-72 p-2">
          <div className="space-y-2 p-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">
                Keine Benachrichtigungen
              </p>
            ) : (
              notifications.map((n: any) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex gap-3 rounded-lg p-3 transition-all hover:bg-accent cursor-pointer border",
                    n.isRead
                      ? "border-border bg-background text-muted-foreground"
                      : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50 text-foreground"
                  )}
                  onClick={() => {
                    if (!n.isRead) {
                      markAsRead.mutate((n.id) , {
                        onSuccess: () => {
                          utils.notification.list.invalidate();
                          utils.notification.unreadCount.invalidate();
                        },
                      });
                    }
                  }}
                >
                  <Info
                    className={cn("h-5 w-5", n.isRead ? "text-muted-foreground" : "text-blue-600 dark:text-blue-400")}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-none truncate">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {n.isRead && (
                    <CheckCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="flex p-3 pt-2 border-t">
          <Button variant="ghost" size="sm" className="flex-1 justify-start h-8" onClick={handleViewAll}>
            Alle anzeigen
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={handleMarkAllAsRead}
            disabled={unreadNotifications.length === 0}
          >
            Alle gelesen
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}