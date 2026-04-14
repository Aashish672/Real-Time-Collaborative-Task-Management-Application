import {
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Paperclip,
  MessageSquare,
  Check,
} from "lucide-react";
import type { Task, Priority } from "@/types/kanban";
import UserAvatar from "@/components/shared/UserAvatar";

const priorityConfig: Record<Priority, { icon: React.ElementType; color: string; label: string }> = {
  high: { icon: AlertTriangle, color: "text-destructive", label: "High" },
  medium: { icon: ArrowUp, color: "text-amber-500", label: "Medium" },
  low: { icon: ArrowDown, color: "text-primary", label: "Low" },
  none: { icon: ArrowRight, color: "text-muted-foreground", label: "None" },
};

interface Props {
  task: Task;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}

export default function TaskCard({ task, isDragging, onDragStart, onDragEnd, onClick }: Props) {
  const prio = priorityConfig[task.priority];
  const PrioIcon = prio.icon;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`group rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing sidebar-transition select-none ${
        isDragging
          ? "opacity-40 border-primary/30 shadow-lg scale-[0.97]"
          : "border-border hover:shadow-sm hover:border-border/80"
      }`}
    >
      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((l) => (
            <span
              key={l.id}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${l.color}15`,
                color: l.color,
              }}
            >
              {l.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3">
          {/* Priority */}
          <div className={`flex items-center gap-1 ${prio.color}`} title={prio.label}>
            <PrioIcon className="h-3.5 w-3.5" />
          </div>

          {/* Comments Count */}
          {task.comments?.length > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground" title={`${task.comments.length} comment(s)`}>
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold tabular-nums">{task.comments.length}</span>
            </div>
          )}
          
          {/* Subtasks Count */}
          {task.subtasks?.length > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
                <Check className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold tabular-nums">{task.subtasks.filter((s:any) => s.is_done).length}/{task.subtasks.length}</span>
            </div>
          )}
        </div>

        {/* Assignees */}
        {task.assignees?.length > 0 && (
          <div className="flex -space-x-2 overflow-hidden">
            {task.assignees.slice(0, 3).map((a: any) => (
              <div key={a.id} className="ring-2 ring-card rounded-full overflow-hidden">
                <UserAvatar name={a.full_name} src={a.avatar_url} size="xs" />
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div className="h-5 w-5 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
