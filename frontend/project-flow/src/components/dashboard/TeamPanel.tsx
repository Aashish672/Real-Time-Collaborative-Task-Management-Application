import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useWorkspaceMembers, useUpdateMemberRole, useProfile } from "@/hooks/useApi";
import UserAvatar from "@/components/shared/UserAvatar";
import InviteModal from "@/components/dashboard/InviteModal";
import RoleSelect from "@/components/dashboard/RoleSelect";

export type Role = "owner" | "admin" | "member" | "viewer";

export default function TeamPanel() {
  const { activeWorkspaceId } = useWorkspace();
  const { data: members = [], isLoading } = useWorkspaceMembers(activeWorkspaceId || undefined);
  const { data: currentUser } = useProfile();
  const updateRoleMutation = useUpdateMemberRole(activeWorkspaceId || "");
  
  const [inviteOpen, setInviteOpen] = useState(false);

  // Find current user's role in this workspace
  const currentUserMember = members.find((m: any) => m.user_id === currentUser?.id);
  const currentUserRole = (currentUserMember?.role as Role) || "viewer";

  const canEditRoles = currentUserRole === "owner" || currentUserRole === "admin";

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role: newRole });
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const handleInvite = (email: string, role: Role) => {
    // Placeholder for invite functionality
    console.log("Inviting:", email, role);
    setInviteOpen(false);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 animate-pulse text-center">
        <p className="text-sm text-muted-foreground">Loading team members...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Team</h2>
        {canEditRoles && (
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 sidebar-transition"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invite Colleague
          </button>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">User</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground w-40">Role</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground italic">
                  No members found in this workspace.
                </td>
              </tr>
            ) : (
              members.map((m: any, i: number) => (
                <tr
                  key={m.user_id}
                  className={`sidebar-transition hover:bg-accent/50 ${
                    i < members.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar name={m.user?.full_name || "Unknown"} src={m.user?.avatar_url} size="sm" />
                      <span className="font-medium text-foreground">{m.user?.full_name || "Unknown"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.user?.email || "No email"}</td>
                  <td className="px-4 py-3">
                    <RoleSelect
                      value={m.role as Role}
                      onChange={(role) => handleRoleChange(m.user_id, role)}
                      disabled={!canEditRoles || m.role === "owner" || m.user_id === currentUser?.id}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
      />
    </div>
  );
}
