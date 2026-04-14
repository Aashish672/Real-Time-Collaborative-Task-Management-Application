import { useWorkspace } from "@/context/WorkspaceContext";
import { useProjects } from "@/hooks/useApi";
import UserAvatar from "@/components/shared/UserAvatar";
import ProgressBar from "@/components/shared/ProgressBar";
import { FolderKanban } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProjectGrid() {
  const { activeWorkspaceId } = useWorkspace();
  const { data: projects = [], isLoading } = useProjects(activeWorkspaceId || undefined);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-lg border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center bg-secondary/10">
        <FolderKanban className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-foreground">No projects yet</p>
        <p className="text-xs text-muted-foreground mt-1">Create your first project to get started</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Projects</h2>
        <button className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground sidebar-transition">
          View all
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p: any) => (
          <Link
            key={p.id}
            to={`/projects/${p.id}`}
            className="group rounded-lg border border-border bg-card p-4 sidebar-transition hover:shadow-sm cursor-pointer"
          >
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary sidebar-transition">
              {p.name}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {p.description || "No description provided."}
            </p>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-muted-foreground">Status</span>
                <span className="text-[11px] font-medium text-foreground uppercase tracking-tighter opacity-70">{p.status}</span>
              </div>
              <ProgressBar value={p.status === "completed" ? 100 : 40} />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex -space-x-1.5">
                {/* Fallback for now as Project doesn't store members directly in the schema I saw, but it's okay */}
                <UserAvatar name="User" size="sm" />
              </div>
              <span className="text-[11px] text-muted-foreground">
                Active
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

