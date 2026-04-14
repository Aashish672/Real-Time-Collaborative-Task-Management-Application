import { FolderKanban, CheckSquare, TrendingUp, Clock } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useProfile, useWorkspaceStatistics } from "@/hooks/useApi";
import ProjectGrid from "@/components/dashboard/ProjectGrid";
import TeamPanel from "@/components/dashboard/TeamPanel";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { activeWorkspaceId } = useWorkspace();
  const { data: user } = useProfile();
  const { data: stats, isLoading: statsLoading } = useWorkspaceStatistics(activeWorkspaceId || undefined);

  const userName = user?.full_name || "there";

  const displayStats = [
    { label: "Total Projects", value: stats?.total_projects || 0, icon: FolderKanban, detail: "Across workspace" },
    { label: "Active Tasks", value: stats?.active_tasks || 0, icon: CheckSquare, detail: "To be completed" },
    { label: "Completion Rate", value: `${stats?.completion_rate || 0}%`, icon: TrendingUp, detail: "Total progress" },
    { label: "Team Members", value: stats?.total_members || 0, icon: Clock, detail: "Active contributors" },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {getGreeting()}, {userName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's what's happening in your workspace today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayStats.map(({ label, value, icon: Icon, detail }) => (
          <div
            key={label}
            className="group rounded-lg border border-border bg-card p-4 sidebar-transition hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-semibold text-foreground">
                {statsLoading ? "..." : value}
              </span>
              <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Project Grid */}
      <ProjectGrid />

      {/* Team Panel */}
      <TeamPanel />
    </div>
  );
}
