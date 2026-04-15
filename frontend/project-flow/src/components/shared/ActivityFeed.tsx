import { useActivity } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  MessageSquare, 
  UserPlus, 
  Move,
  Layout
} from "lucide-react";
import { cn } from "@/lib/utils";

const actionIcons: Record<string, any> = {
  created: { icon: Plus, color: "text-green-500", bg: "bg-green-500/10" },
  updated: { icon: RefreshCw, color: "text-blue-500", bg: "bg-blue-500/10" },
  completed: { icon: CheckCircle2, color: "text-purple-500", bg: "bg-purple-500/10" },
  commented: { icon: MessageSquare, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  assigned: { icon: UserPlus, color: "text-amber-500", bg: "bg-amber-500/10" },
  moved: { icon: Move, color: "text-slate-500", bg: "bg-slate-500/10" },
  default: { icon: Layout, color: "text-primary", bg: "bg-primary/10" }
};

export default function ActivityFeed() {
  const { data: activities, isLoading } = useActivity();

  if (isLoading) {
    return (
      <div className="space-y-4 py-4 px-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/4 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center px-4">
        <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-4">
          <Layout className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-foreground">No recent activity</p>
        <p className="text-xs text-muted-foreground mt-1">Actions in this workspace will appear here</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border" />

      <div className="space-y-6 relative">
        {activities.map((activity, idx) => {
          const config = actionIcons[activity.action] || actionIcons.default;
          const Icon = config.icon;

          return (
            <div key={activity.id} className="flex gap-4 group">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10 sidebar-transition",
                config.bg,
                config.color,
                "group-hover:scale-110 shadow-sm"
              )}>
                <Icon className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex flex-col">
                  <p className="text-sm text-foreground leading-tight">
                    <span className="font-semibold">{activity.user?.full_name || "Someone"}</span>
                    {" "}
                    <span className="text-muted-foreground">
                      {activity.action === 'created' && `created task "${activity.payload?.task_title}"`}
                      {activity.action === 'updated' && `updated task "${activity.payload?.task_title}"`}
                      {activity.action === 'moved' && `moved task "${activity.payload?.task_title}" to ${activity.payload?.new_status?.replace('_', ' ')}`}
                      {activity.action === 'completed' && `completed task "${activity.payload?.task_title}"`}
                      {activity.action === 'commented' && `commented on "${activity.payload?.task_title}"`}
                      {activity.action === 'assigned' && `assigned "${activity.payload?.task_title}" to a team member`}
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
                     {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                     <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground" />
                     <span className="capitalize">{activity.entity_type}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
