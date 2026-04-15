import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, LogOut, User, CheckCheck, Tag, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import UserAvatar from "@/components/shared/UserAvatar";
import LabelManagementModal from "../kanban/LabelManagementModal";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [labelsModalOpen, setLabelsModalOpen] = useState(false);
  
  const { notifications, unreadCount, markRead, markAllRead, isLoading } = useNotifications();

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
                    onClick={() => markAllRead.mutate()}
                    disabled={markAllRead.isPending}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium sidebar-transition disabled:opacity-50"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all as read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-[340px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-3">
                      <Bell className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">All caught up!</p>
                    <p className="text-[10px] text-muted-foreground">No new notifications at the moment.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markRead.mutate(n.id)}
                      disabled={markRead.isPending}
                      className={cn(
                        "flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-accent/50 sidebar-transition border-b border-border/50 last:border-0",
                        !n.is_read && "bg-primary/5"
                      )}
                    >
                      <UserAvatar name={n.payload?.actor_name || "System"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground leading-snug">
                          <span className="font-semibold">{n.payload?.actor_name || "Someone"}</span>{" "}
                          <span className="text-muted-foreground">
                            {n.type === "task_assigned" && `assigned you to "${n.payload?.task_title}"`}
                            {n.type === "comment_mentioned" && `commented on "${n.payload?.task_title}"`}
                            {n.type === "project_updated" && `updated project details`}
                          </span>
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!n.is_read && (
                        <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </button>
                  ))
                )}
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
