import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  Bell,
  Settings,
  Users,
  ChevronDown,
  Plus,
  Hash,
} from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useWorkspaces, useProjects } from "@/hooks/useApi";
import CreateWorkspaceModal from "../dashboard/CreateWorkspaceModal";
import CreateProjectModal from "../kanban/CreateProjectModal";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "My Tasks", icon: CheckSquare, path: "/my-tasks" },
  { label: "Notifications", icon: Bell, path: "/notifications" },
];

export default function AppSidebar() {
  const location = useLocation();
  const [wsOpen, setWsOpen] = useState(false);
  const [createWsOpen, setCreateWsOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const { data: workspaces = [] } = useWorkspaces();
  const { activeWorkspaceId, setActiveWorkspaceId, activeWorkspace } = useWorkspace();
  const { data: projects = [] } = useProjects(activeWorkspaceId || undefined);

  const activeWs = activeWorkspace || { name: "..." };

  return (
    <>
      <aside className="fixed left-0 top-0 bottom-0 flex flex-col border-r border-border bg-secondary/40"
        style={{ width: "var(--sidebar-width)" }}>
        {/* Workspace Switcher */}
        <div className="relative px-3 pt-4 pb-2">
          <button
            onClick={() => setWsOpen(!wsOpen)}
            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-semibold text-foreground hover:bg-accent sidebar-transition"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
                {activeWs.name[0]}
              </div>
              <span className="truncate">{activeWs.name}</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${wsOpen ? "rotate-180" : ""}`} />
          </button>

          {wsOpen && (
            <div className="absolute left-3 right-3 top-full z-50 mt-1 rounded-md border border-border bg-popover p-1 shadow-lg animate-fade-in focus-within:outline-none">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => { setActiveWorkspaceId(ws.id); setWsOpen(false); }}
                  className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm sidebar-transition ${ws.id === activeWorkspaceId ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground text-[10px] font-bold">
                    {ws.name[0]}
                  </div>
                  {ws.name}
                </button>
              ))}
              <div className="my-1 h-px bg-border" />
              <button
                onClick={() => { setCreateWsOpen(true); setWsOpen(false); }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-primary/10 sidebar-transition"
              >
                <Plus className="h-4 w-4" />
                Add Workspace
              </button>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <div className="space-y-0.5">
            {navItems.map(({ label, icon: Icon, path }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium sidebar-transition ${active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}

            {/* Team Management Link */}
            <Link
              to="/team"
              className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium sidebar-transition ${location.pathname === "/team"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
            >
              <Users className="h-4 w-4" />
              Team
            </Link>
          </div>

          {/* Projects */}
          <div className="mt-6">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Projects
              </span>
              <button
                onClick={() => setCreateProjectOpen(true)}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent sidebar-transition"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-0.5">
              {projects.map((project) => {
                const active = location.pathname === `/projects/${project.id}`;
                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm sidebar-transition ${active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                  >
                    <Hash className="h-3.5 w-3.5" style={{ color: project.color || "currentColor" }} />
                    <span className="truncate">{project.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Bottom Settings */}
        <div className="border-t border-border px-3 py-2">
          <Link
            to="/settings"
            className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium sidebar-transition ${location.pathname === "/settings"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
          >
            <Settings className="h-4 w-4" />
            Workspace Settings
          </Link>
        </div>
      </aside>

      <CreateWorkspaceModal
        open={createWsOpen}
        onClose={() => setCreateWsOpen(false)}
        onAdd={() => { }}
      />

      <CreateProjectModal
        open={createProjectOpen}
        workspaceId={activeWorkspaceId || undefined}
        onClose={() => setCreateProjectOpen(false)}
        onAdd={() => { }}
      />
    </>
  );
}
