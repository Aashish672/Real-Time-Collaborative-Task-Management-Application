import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// --- AUTH ---

const isLoggedIn = () => !!localStorage.getItem("access_token");

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => api<any>("/users/me"),
    retry: false,
    enabled: isLoggedIn(),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api<any>("/users/me", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data);
      // Also update AuthContext if possible, but invalidating or letting the user refresh is fine for now.
    },
  });
};

export const useWorkspaceMembers = (workspaceId?: string) => {
  return useQuery({
    queryKey: ["workspaces", workspaceId, "members"],
    queryFn: () => api<any[]>(`/workspaces/${workspaceId}/members`),
    enabled: !!workspaceId,
  });
};

export interface WorkspaceStats {
  total_members: number;
  total_projects: number;
  total_tasks: number;
  active_tasks: number;
  completion_rate: number;
}

export const useWorkspaceStatistics = (workspaceId?: string) => {
  return useQuery({
    queryKey: ["workspace_statistics", workspaceId],
    queryFn: () => api<WorkspaceStats>(`/workspaces/${workspaceId}/statistics`),
    enabled: !!workspaceId,
  });
};

export const useWorkspaceLabels = (workspaceId?: string) => {
  return useQuery({
    queryKey: ["workspaces", workspaceId, "labels"],
    queryFn: () => api<any[]>(`/workspaces/${workspaceId}/labels`),
    enabled: !!workspaceId,
  });
};

export const useCreateLabel = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; color: string }) =>
      api<any>(`/workspaces/${workspaceId}/labels`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "labels"] });
    },
  });
};

export const useUpdateLabel = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ labelId, ...body }: { labelId: string; name: string; color: string }) =>
      api<any>(`/labels/${labelId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "labels"] });
    },
  });
};

export const useDeleteLabel = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (labelId: string) =>
      api<any>(`/labels/${labelId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "labels"] });
    },
  });
};

export const useUpdateMemberRole = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api<any>(`/workspaces/${workspaceId}/members/${userId}?role=${role}`, {
        method: "PUT",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "members"] });
    },
  });
};

export const useRemoveMember = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api<any>(`/workspaces/${workspaceId}/members/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "members"] });
    },
  });
};

// --- INVITATIONS ---

export const useWorkspaceInvitations = (workspaceId?: string) => {
  return useQuery({
    queryKey: ["workspaces", workspaceId, "invitations"],
    queryFn: () => api<any[]>(`/workspaces/${workspaceId}/invitations`),
    enabled: !!workspaceId,
  });
};

export const useInviteMember = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      api<any>(`/workspaces/${workspaceId}/invitations`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "invitations"] });
    },
  });
};

export const useRevokeInvitation = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) =>
      api<any>(`/workspaces/invitations/${invitationId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "invitations"] });
    },
  });
};

export const useInvitationInfo = (token: string | undefined) => {
  return useQuery({
    queryKey: ["invitation_info", token],
    queryFn: () => api<any>(`/workspaces/invitations/info/${token}`),
    enabled: !!token,
    retry: false,
  });
};

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) =>
      api<any>(`/workspaces/invitations/accept/${token}`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
};

export const useWorkspaces = () => {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api<any[]>("/workspaces/"),
    enabled: isLoggedIn(),
    retry: false,
  });
};

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug: string; logo_url?: string; description?: string }) =>
      api<any>("/workspaces/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
};

export const useCurrentWorkspace = () => {
  // Simple helper to find current workspace from URL or localStorage
  // For now, we'll extract it from the URL if possible, or just use the first one from list
  const { data: workspaces } = useWorkspaces();
  const slug = window.location.pathname.split('/')[1];
  
  if (!workspaces) return { data: null };
  const current = workspaces.find(w => w.slug === slug) || workspaces[0];
  return { data: current };
};

export const useUpdateWorkspace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, ...data }: { workspaceId: string; name?: string; slug?: string; logo_url?: string | null }) =>
      api<any>(`/workspaces/${workspaceId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.setQueryData(["workspace_stats", data.id], data);
    },
  });
};

export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) =>
      api<void>(`/workspaces/${workspaceId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
};

// --- PROJECTS ---

export const useProjects = (workspaceId?: string) => {
  return useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => api<any[]>(`/workspaces/${workspaceId}/projects`),
    enabled: !!workspaceId,
  });
};

export const useProject = (projectId?: string) => {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api<any>(`/projects/${projectId}`),
    enabled: !!projectId,
  });
};

export const useCreateProject = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color?: string; description?: string }) =>
      api<any>(`/workspaces/${workspaceId}/projects`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
    },
  });
};

// --- TASKS ---

export const useTasks = (projectId?: string) => {
  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => api<any[]>(`/projects/${projectId}/tasks`),
    enabled: !!projectId,
  });
};

export const useAssignedTasks = () => {
  return useQuery({
    queryKey: ["tasks", "assigned"],
    queryFn: () => api<any[]>("/tasks/assigned-to-me"),
    enabled: isLoggedIn(),
    retry: false,
  });
};

export const useCreateTask = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { 
        title: string; 
        priority: string; 
        status: string; 
        description?: string; 
        due_date?: string; 
        assignee_ids?: string[]; 
        label_ids?: string[];
    }) =>
      api<any>(`/projects/${projectId}/tasks`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
};

export const useUpdateTask = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, ...data }: any) =>
      api<any>(`/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
};

export const useUpdateTaskStatus = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      api<any>(`/tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
};

export const useDeleteTask = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      api<any>(`/tasks/${taskId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
};

export const useAddTaskLabel = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, labelId }: { taskId: string; labelId: string }) =>
      api<any>(`/tasks/${taskId}/labels/${labelId}`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
};

export const useRemoveTaskLabel = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, labelId }: { taskId: string; labelId: string }) =>
      api<any>(`/tasks/${taskId}/labels/${labelId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
};

export const useAddTaskAssignee = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      api<any>(`/tasks/${taskId}/assignees`, {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
};

export const useRemoveTaskAssignee = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      api<any>(`/tasks/${taskId}/assignees/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
};

// --- COMMENTS ---

export const useCreateComment = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, text }: { taskId: string; text: string }) =>
      api<any>(`/tasks/${taskId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: text }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
};

export const useGenerateAiSubtasks = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      api<any>(`/tasks/${taskId}/generate-subtasks`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
};

// --- SUBTASKS ---

export const useCreateSubtask = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      api<any>(`/tasks/${taskId}/subtasks`, {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
};

export const useToggleSubtask = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, subtaskId }: { taskId: string; subtaskId: string }) =>
      api<any>(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
};

export const useDeleteSubtask = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, subtaskId }: { taskId: string; subtaskId: string }) =>
      api<any>(`/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
};

// --- ATTACHMENTS ---

export const useTaskAttachments = (taskId?: string) => {
  return useQuery({
    queryKey: ["tasks", taskId, "attachments"],
    queryFn: () => api<any[]>(`/tasks/${taskId}/attachments`),
    enabled: !!taskId,
  });
};

export const useUploadAttachment = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, file }: { taskId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      
      return api<any>(`/tasks/${taskId}/attachments/upload`, {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId, "attachments"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
};

export const useDeleteAttachment = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) =>
      api<any>(`/attachments/${attachmentId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] }); // Invalidate all task queries for simplicity, or specific if known
    },
  });
};

// --- Webhooks ---

export function useWorkspaceWebhooks(workspaceId?: string) {
  return useQuery({
    queryKey: ["workspaces", workspaceId, "webhooks"],
    queryFn: () => api<any[]>(`/workspaces/${workspaceId}/webhooks`),
    enabled: !!workspaceId,
  });
}

export function useCreateWebhook(workspaceId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { url: string; event_type: string }) =>
      api<any>(`/workspaces/${workspaceId}/webhooks`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "webhooks"] });
    },
  });
}

export function useDeleteWebhook(workspaceId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (webhookId: string) =>
      api<void>(`/workspaces/webhooks/${webhookId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "webhooks"] });
    },
  });
}

export function useToggleWebhook(workspaceId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (webhookId: string) =>
      api<any>(`/workspaces/webhooks/${webhookId}/toggle`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "webhooks"] });
    },
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: (webhookId: string) =>
      api<any>(`/workspaces/webhooks/${webhookId}/test`, { method: "POST" }),
  });
}
