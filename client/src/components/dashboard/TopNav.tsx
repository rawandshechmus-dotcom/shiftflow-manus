import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NotificationBell from "@/components/NotificationBell";
import { useTheme } from "@/contexts/ThemeContext";
import { LogOut, Moon, Sun, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import HandoverPopup from "../HandoverPopup";

export default function TopNav() {
  const { user, logout } = useAuth();
  const [showHandover, setShowHandover] = useState(true);
  const { theme, toggleTheme } = useTheme();

  if (!user) {
    return (
      <header className="h-16 border-b glass-card flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="font-bold text-xl tracking-tight text-primary">ShiftFlow</span>
        </div>
        <Button onClick={() => { window.location.href = "/login"; }} size="sm">
          Sign in
        </Button>
      </header>
    );
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 glass-card border-b flex items-center justify-between px-6 sticky top-0 z-40"
      >
      <HandoverPopup open={showHandover} onClose={() => setShowHandover(false)} />
    
      {/* Linker Bereich: Logo */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg tracking-tight leading-none">ShiftFlow</span>
          <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">Dashboard</span>
        </div>
      </div>

      {/* Rechter Bereich: Dark-Mode, Glocke, Avatar, Logout */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="h-9 w-9 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
          title="Dark Mode umschalten"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <NotificationBell />

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 border-2 border-transparent hover:border-primary/20 transition-colors">
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
              {user.name?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start min-w-0">
            <span className="text-sm font-medium leading-none truncate max-w-[120px]">
              {user.name ?? "User"}
            </span>
            <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
              {user.email ?? "-"}
            </span>
          </div>
          <button
            onClick={logout}
            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground flex items-center justify-center transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.header>
  );
}