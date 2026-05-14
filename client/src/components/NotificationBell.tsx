import { Bell } from "lucide-react";

export function NotificationBell() {
  
  const unreadCount = 0;

  return (
    <div className="relative cursor-pointer">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </div>
  );
}