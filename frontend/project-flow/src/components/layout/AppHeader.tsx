import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, LogOut, User, CheckCheck, Tag } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import UserAvatar from "@/components/shared/UserAvatar";
import LabelManagementModal from "../kanban/LabelManagementModal";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface Notification {
  id: string;
  text: string;
  actor: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: "n1", text: 'assigned you to "Fix Auth Bug"', actor: "Sarah Kim", time: "2m ago", read: false },
  { id: "n2", text: "commented on \"API endpoints\"", actor: "Bob Lee", time: "15m ago", read: false },
  { id: "n3", text: "AI Breakdown completed for \"Set up auth flow\"", actor: "System", time: "1h ago", read: false },
  { id: "n4", text: 'moved "Design onboarding" to In Review', actor: "Diana Patel", time: "3h ago", read: true },
  { id: "n5", text: "invited you to project \"Mobile App v2\"", actor: "Carlos Diaz", time: "1d ago", read: true },
];

export default function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [labelsModalOpen, setLabelsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header
        className="fixed top-0 right-0 z-30 flex items-center border-b border-border bg-background/80 backdrop-blur-sm px-4"
        style={{ left: "var(--sidebar-width)", height: "var(--header-height)" }}
      >
        {/* Search */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tasks, projects..."
              className="w-full rounded-md border border-border bg-secondary/50 py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring sidebar-transition"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 ml-4">
          {/* Notification Bell Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground sidebar-transition">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[360px] p-0" sideOffset={8}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium sidebar-transition"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all as read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-[340px] overflow-y-auto">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-accent/50 sidebar-transition border-b border-border/50 last:border-0",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    {n.actor === "System" ? (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Bell className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <UserAvatar name={n.actor} size="sm" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground leading-snug">
                        <span className="font-semibold">{n.actor}</span>{" "}
                        <span className="text-muted-foreground">{n.text}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{n.time}</p>
                    </div>
                    {!n.read && (
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-border px-4 py-2.5">
                <button
                  onClick={() => navigate("/notifications")}
                  className="w-full text-center text-xs font-medium text-primary hover:text-primary/80 sidebar-transition"
                >
                  View all notifications
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* User Avatar */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 sidebar-transition overflow-hidden"
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="h-full w-full object-cover" />
              ) : (
                user?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "JD"
              )}
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-md border border-border bg-popover p-1 shadow-lg animate-fade-in">
                  <button
                    onClick={() => { navigate("/profile"); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground sidebar-transition"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => { setLabelsModalOpen(true); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground sidebar-transition"
                  >
                    <Tag className="h-4 w-4" />
                    Manage Labels
                  </button>
                  <div className="my-1 h-px bg-border" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 sidebar-transition"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <LabelManagementModal 
        open={labelsModalOpen} 
        onClose={() => setLabelsModalOpen(false)} 
      />
    </>
  );
}
