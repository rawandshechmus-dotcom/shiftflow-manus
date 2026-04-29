import React from "react";
import { Bell, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ScrollArea,
} from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

type NotificationType = "info" | "success" | "warning" | "error";

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
} as const;

const IconComponent = ({ type, isRead }: { type: NotificationType; isRead: boolean }) => {
  const Icon = typeIcons[type];
  return <Icon className={cn(
    "h-5 w-5",
    isRead ? "text-muted-foreground" : "text-blue-600 dark:text-blue-400"
  )} />;
};

export function NotificationBell() {
  const { data: unreadCountData } = trpc.notification.unreadCount.useQuery();
  const unreadCount = unreadCountData ?? 0;
  
  const { data: notifications = [] } = trpc.notification.list.useQuery();
  const utils = trpc.useUtils();
  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.unreadCount.invalidate();
      utils.notification.list.invalidate();
    },
  });

  const [open, setOpen] = useState(false);

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const unreadNotifications = notifications.filter((n: any) => !n.isRead);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 rounded-lg"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4 pb-2 font-medium">
          Notifications ({unreadNotifications.length})
        </div>
        <ScrollArea className="h-72 p-2">
          <div className="space-y-2 p-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">
                No notifications
              </p>
            ) : (
                notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex gap-3 rounded-lg p-3 transition-all hover:bg-accent cursor-pointer border",
                    notification.isRead 
                      ? "border-border bg-background text-muted-foreground" 
                      : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50 text-foreground"
                  )}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                >
                  <div className="flex-shrink-0">
                    <IconComponent 
                      type={notification.type} 
                      isRead={notification.isRead} 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-none truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {notification.isRead && (
                    <CheckCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="flex p-3 pt-2 border-t">
          <Button variant="ghost" size="sm" className="flex-1 justify-start h-8">
            View all
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            Mark all as read
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

