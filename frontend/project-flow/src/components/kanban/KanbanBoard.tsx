import { useRef, useState } from "react";
import type { Task, Status } from "@/types/kanban";
import { COLUMNS } from "@/types/kanban";
import TaskCard from "./TaskCard";

interface Props {
  getColumnTasks: (status: Status) => Task[];
  moveTask: (taskId: string, newStatus: Status) => void;
  onTaskClick: (task: Task) => void;
}

export default function KanbanBoard({ getColumnTasks, moveTask, onTaskClick }: Props) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<Status | null>(null);
  const dragCounter = useRef<Record<string, number>>({});

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDropTarget(null);
    dragCounter.current = {};
  };

  const handleDragEnter = (columnId: Status) => {
    dragCounter.current[columnId] = (dragCounter.current[columnId] || 0) + 1;
    setDropTarget(columnId);
  };

  const handleDragLeave = (columnId: Status) => {
    dragCounter.current[columnId] = (dragCounter.current[columnId] || 0) - 1;
    if (dragCounter.current[columnId] <= 0) {
      dragCounter.current[columnId] = 0;
      if (dropTarget === columnId) setDropTarget(null);
    }
  };

  const handleDrop = (columnId: Status) => {
    if (draggedTask) {
      moveTask(draggedTask, columnId);
    }
    setDraggedTask(null);
    setDropTarget(null);
    dragCounter.current = {};
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-0 flex-1">
      {COLUMNS.map((col) => {
        const tasks = getColumnTasks(col.id);
        const isOver = dropTarget === col.id && draggedTask !== null;

        return (
          <div
            key={col.id}
            className={`flex flex-col min-w-[272px] w-[272px] shrink-0 rounded-lg sidebar-transition ${
              isOver ? "bg-primary/5 ring-1 ring-primary/20" : "bg-secondary/30"
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => handleDragEnter(col.id)}
            onDragLeave={() => handleDragLeave(col.id)}
            onDrop={() => handleDrop(col.id)}
          >
            {/* Column Header */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: col.color }}
              />
              <span className="text-xs font-semibold text-foreground">{col.title}</span>
              <span className="ml-auto text-[11px] font-medium text-muted-foreground tabular-nums">
                {tasks.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isDragging={draggedTask === task.id}
                  onDragStart={() => handleDragStart(task.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onTaskClick(task)}
                />
              ))}

              {tasks.length === 0 && !isOver && (
                <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                  No tasks
                </div>
              )}

              {isOver && (
                <div className="rounded-md border-2 border-dashed border-primary/30 bg-primary/5 px-3 py-4 text-center text-xs text-primary font-medium">
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
