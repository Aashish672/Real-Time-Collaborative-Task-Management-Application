import React, { createContext, useContext, useState, useEffect } from "react";
import { useWorkspaces } from "@/hooks/useApi";

interface WorkspaceContextType {
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
  activeWorkspace: any | null;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { data: workspaces = [], isLoading } = useWorkspaces();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

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
