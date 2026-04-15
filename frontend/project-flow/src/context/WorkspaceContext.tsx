import React, { createContext, useContext, useState, useEffect } from "react";
import { useWorkspaces } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";

interface WorkspaceContextType {
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
  activeWorkspace: any | null;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { data: workspaces = [], isLoading } = useWorkspaces();
  const [activeWorkspaceId, _setActiveWorkspaceId] = useState<string | null>(() => {
    return localStorage.getItem("active_workspace_id");
  });

  const setActiveWorkspaceId = (id: string | null) => {
    if (id) localStorage.setItem("active_workspace_id", id);
    else localStorage.removeItem("active_workspace_id");
    _setActiveWorkspaceId(id);
  };

  // Reset active workspace when user changes (only if it doesn't belong to them)
  useEffect(() => {
    if (user?.id) {
       // Optional: verify current stored ws belongs to user
    } else {
       setActiveWorkspaceId(null);
    }
  }, [user?.id]);

  // Set default workspace if none selected
  useEffect(() => {
    if (workspaces.length > 0 && !activeWorkspaceId) {
      setActiveWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, activeWorkspaceId]);

  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId) || workspaces[0] || null;

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspaceId,
        setActiveWorkspaceId,
        activeWorkspace,
        isLoading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
