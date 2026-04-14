import { useAssignedTasks } from "@/hooks/useApi";
import { CheckSquare, ExternalLink, Clock, Hash } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function MyTasks() {
  const { data: tasks = [], isLoading } = useAssignedTasks();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-40 bg-secondary/20 rounded" />
        <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-secondary/20 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            My Tasks
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
            A centralized view of all tasks assigned to you across your workspace.
        </p>
      </div>

      <div className="space-y-3">
        {tasks.map((task: any) => (
          <Link
            key={task.id}
            to={`/projects/${task.project_id}`}
            className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
          >
            <div className={cn(
                "h-2 w-2 rounded-full shrink-0",
                task.priority === "high" || task.priority === "urgent" ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.4)]" :
                task.priority === "medium" ? "bg-amber-500" : "bg-primary"
            )} />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {task.title}
                    </h3>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        Project ID: {task.project_id.slice(0, 8)}
                    </span>
                    {task.due_date && (
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(task.due_date).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 text-right shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-1 rounded">
                    {task.status.replace("_", " ")}
                </span>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        ))}

        {tasks.length === 0 && (
          <div className="mt-12 rounded-2xl border-2 border-dashed border-border bg-accent/10 p-12 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary/50 text-muted-foreground mb-4">
              <CheckSquare className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">All caught up!</h3>
            <p className="mt-1 text-xs text-muted-foreground">You don't have any tasks assigned currently.</p>
          </div>
        )}
      </div>
    </div>
  );
}
