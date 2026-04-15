import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useWorkspace } from "@/context/WorkspaceContext";

export interface SearchResults {
  projects: Array<{
    id: string;
    name: string;
    workspace_id: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    project_id: string;
    status: string;
  }>;
}

export const useSearch = (query: string) => {
  const { activeWorkspaceId } = useWorkspace();
  
  return useQuery({
    queryKey: ["search", activeWorkspaceId, query],
    queryFn: () => 
      api<SearchResults>(`/workspaces/${activeWorkspaceId}/search?q=${encodeURIComponent(query)}`),
    enabled: !!activeWorkspaceId && query.length >= 2,
    staleTime: 60 * 1000, // 1 minute
  });
};
