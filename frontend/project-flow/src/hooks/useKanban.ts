import { useState, useCallback } from "react";
import type { Task, Status, Priority } from "@/types/kanban";
import { toast } from "sonner";
import { useTasks, useUpdateTaskStatus, useCreateTask, useUpdateTask, useWorkspaceMembers, useWorkspaceLabels } from "./useApi";

export function useKanban(projectId: string, workspaceId?: string) {
  const { data: tasks = [], isLoading: tasksLoading, error } = useTasks(projectId);
  const { data: members = [], isLoading: membersLoading } = useWorkspaceMembers(workspaceId);
  const { data: labels = [], isLoading: labelsLoading } = useWorkspaceLabels(workspaceId);

  const isLoading = tasksLoading || membersLoading || labelsLoading;

  const updateStatusMutation = useUpdateTaskStatus(projectId);
  const createTaskMutation = useCreateTask(projectId);
  const updateTaskMutation = useUpdateTask(projectId);

  const [filterLabel, setFilterLabel] = useState<string | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);

  const filteredTasks = tasks.filter((t: Task) => {
    if (filterLabel && !t.labels?.some((l) => l.id === filterLabel)) return false;
    if (filterAssignee && !t.assignees?.some((a: any) => a.id === filterAssignee)) return false;
    return true;
  });

  const getColumnTasks = useCallback(
    (status: Status) => filteredTasks.filter((t: Task) => t.status === status),
    [filteredTasks]
  );

  const moveTask = useCallback(async (taskId: string, newStatus: Status) => {
    try {
      await updateStatusMutation.mutateAsync({ taskId, status: newStatus });
    } catch (err) {
      toast.error("Failed to move task");
    }
  }, [updateStatusMutation]);

  const addTask = useCallback(
    async (title: string, priority: Priority, labelIds: string[], assigneeIds: string[]) => {
      try {
        await createTaskMutation.mutateAsync({
          title,
          priority,
          status: "todo",
          label_ids: labelIds,
          assignee_ids: assigneeIds,
        });
        toast.success("Task created");
      } catch (err) {
        toast.error("Failed to create task");
      }
    },
    [createTaskMutation]
  );

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      await updateTaskMutation.mutateAsync({ taskId, ...updates });
    } catch (err) {
      toast.error("Failed to update task");
    }
  }, [updateTaskMutation]);

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    isLoading,
    error,
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
  };
}
