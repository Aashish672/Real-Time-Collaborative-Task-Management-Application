import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useEffect } from "react";

export interface Notification {
  id: string;
  type: string;
  payload: any;
  is_read: boolean;
  created_at: string;
}

export interface Activity {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  payload: any;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

export const useNotifications = () => {
  const queryClient = useQueryClient();
  
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<Notification[]>("/notifications"),
    staleTime: 30000,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await api<{ unread_count: number }>("/notifications/unread_count");
      return res.unread_count;
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api(`/notifications/${id}`, { method: "PATCH", body: JSON.stringify({ is_read: true }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => api("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
  const deleteNotification = useMutation({
    mutationFn: (id: string) => api(`/notifications/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  return { notifications, unreadCount, markRead, markAllRead, deleteNotification, isLoading };
};

export const useActivity = (limit = 20) => {
  const { activeWorkspaceId } = useWorkspace();
  
  return useQuery({
    queryKey: ["activity", activeWorkspaceId],
    queryFn: () => api<Activity[]>(`/workspaces/${activeWorkspaceId}/activity?limit=${limit}`),
    enabled: !!activeWorkspaceId,
    staleTime: 60000,
  });
};
