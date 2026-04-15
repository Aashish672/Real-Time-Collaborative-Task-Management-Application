import { useNotifications } from "@/hooks/useNotifications";
import { Bell, CheckCheck, Trash2, Calendar, FileText, UserPlus, Info } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/shared/UserAvatar";
import { useNavigate } from "react-router-dom";

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification, isLoading } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (n: any) => {
    if (!n.is_read) {
      markRead.mutate(n.id);
    }
    
    if (n.payload?.workspace_id && n.type === 'workspace_joined') {
        navigate(`/settings?workspace=${n.payload.workspace_id}`);
    } else if (n.payload?.project_id) {
        const taskId = n.payload?.entity_id;
        if (n.type === 'task_assigned' || n.type === 'comment_mentioned') {
            navigate(`/projects/${n.payload.project_id}?task=${taskId}`);
        } else {
            navigate(`/projects/${n.payload.project_id}`);
        }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated with your latest assignments and mentions.
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-2 rounded-md bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-4">
              <Bell className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">You're all caught up!</h3>
            <p className="text-sm text-muted-foreground max-w-[320px] mx-auto mt-2">
              No new notifications yet. We'll let you know when something important happens.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "p-4 sm:p-6 transition-all hover:bg-accent/30 cursor-pointer flex gap-4 items-start group relative",
                  !n.is_read && "bg-primary/5"
                )}
                onClick={() => handleNotificationClick(n)}
              >
                <div className="relative shrink-0">
                    <UserAvatar name={n.payload?.actor_name || "System"} size="md" />
                    {!n.is_read && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3 rounded-full bg-primary border-2 border-card" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-foreground truncate">
                        {n.payload?.actor_name || "Someone"}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(n.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  
                  <div className="text-sm text-foreground flex items-center gap-2">
                     <div className={cn(
                        "p-1 rounded bg-muted text-muted-foreground",
                        n.type === 'task_assigned' && "text-blue-500 bg-blue-500/10",
                        n.type === 'comment_mentioned' && "text-indigo-500 bg-indigo-500/10"
                     )}>
                        {n.type === 'task_assigned' && <UserPlus className="h-3.5 w-3.5" />}
                        {n.type === 'comment_mentioned' && <FileText className="h-3.5 w-3.5" />}
                        {n.type === 'project_updated' && <Info className="h-3.5 w-3.5" />}
                        {n.type === 'workspace_joined' && <UserPlus className="h-3.5 w-3.5" />}
                     </div>
                     <span className="text-muted-foreground">
                        {n.type === 'task_assigned' && `assigned you to `}
                        {n.type === 'comment_mentioned' && `commented on `}
                        {n.type === 'project_updated' && `updated `}
                        {n.type === 'workspace_joined' && `added you to `}
                        <span className="font-semibold text-foreground">
                            {n.payload?.task_title || n.payload?.workspace_name || "the project"}
                        </span>
                     </span>
                  </div>

                  {n.payload?.comment_body && (
                    <div className="mt-2.5 p-3 rounded-md bg-muted/40 border-l-2 border-primary/20 italic text-xs text-muted-foreground line-clamp-2">
                        "{n.payload.comment_body}"
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification.mutate(n.id);
                        }}
                        disabled={deleteNotification.isPending}
                        className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                        title="Delete notification"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
