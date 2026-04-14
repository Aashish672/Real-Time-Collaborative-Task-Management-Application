import { useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import type { Task } from "@/types/kanban";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useKanban } from "@/hooks/useKanban";
import { useProject } from "@/hooks/useApi";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import AddTaskModal from "@/components/kanban/AddTaskModal";
import FilterDropdown from "@/components/kanban/FilterDropdown";
import TaskDetailModal from "@/components/kanban/TaskDetailModal";

export default function ProjectBoard() {
  const { id } = useParams<{ id: string }>();
  const { activeWorkspaceId } = useWorkspace();
  const { data: project, isLoading: projectLoading } = useProject(id || "");
  const {
    allTasks,
    isLoading: tasksLoading,
    getColumnTasks,
    moveTask,
    addTask,
    updateTask,
    filterLabel,
    setFilterLabel,
    filterAssignee,
    setFilterAssignee,
    members,
    labels,
  } = useKanban(id || "", activeWorkspaceId || project?.workspace_id);

  const [addOpen, setAddOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const projectName = project?.name || (projectLoading ? "Loading project..." : "Project Board");
  const isLoading = projectLoading || tasksLoading;

  const labelOptions = labels.map((l: any) => ({ value: l.id, label: l.name, color: l.color }));
  const assigneeOptions = members.map((m: any) => ({ value: m.user_id, label: m.user.full_name }));

  // Get fresh task data when selected
  const currentTask = selectedTask ? allTasks.find((t) => t.id === selectedTask.id) || selectedTask : null;

  if (isLoading && !project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium">Loading board data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height)-3rem)] animate-in fade-in duration-500">
      {/* Board Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent sidebar-transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground">{projectName}</h1>
        </div>

        <div className="flex items-center gap-2">
          <FilterDropdown label="Label" options={labelOptions} value={filterLabel} onChange={setFilterLabel} />
          <FilterDropdown label="Assignee" options={assigneeOptions} value={filterAssignee} onChange={setFilterAssignee} />
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 sidebar-transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </button>
        </div>
      </div>

      {/* Board */}
      <KanbanBoard getColumnTasks={getColumnTasks} moveTask={moveTask} onTaskClick={setSelectedTask} />

      {/* Add Task Modal */}
      <AddTaskModal 
        open={addOpen} 
        onClose={() => setAddOpen(false)} 
        onAdd={addTask} 
        members={members}
        labels={labels}
      />

      {/* Task Detail Modal */}
      {currentTask && (
        <TaskDetailModal
          task={currentTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          members={members}
          labels={labels}
        />
      )}
    </div>
  );
}
