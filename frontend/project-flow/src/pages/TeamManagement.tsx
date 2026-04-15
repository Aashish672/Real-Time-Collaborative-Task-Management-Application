import { useState } from "react";
import { Users, Mail, ShieldCheck, MoreVertical, Plus, UserPlus, X, Clock } from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";
import { toast } from "sonner";
import { useWorkspace } from "@/context/WorkspaceContext";
import { 
  useWorkspaceMembers, 
  useUpdateMemberRole, 
  useRemoveMember,
  useWorkspaceInvitations,
  useInviteMember,
  useRevokeInvitation
} from "@/hooks/useApi";

export default function TeamManagement() {
    const { activeWorkspaceId } = useWorkspace();
    const { data: members = [], isLoading: membersLoading } = useWorkspaceMembers(activeWorkspaceId || undefined);
    const { data: invitations = [], isLoading: invitesLoading } = useWorkspaceInvitations(activeWorkspaceId || undefined);
    
    const updateRoleMutation = useUpdateMemberRole(activeWorkspaceId || "");
    const removeMemberMutation = useRemoveMember(activeWorkspaceId || "");
    const inviteMutation = useInviteMember(activeWorkspaceId || "");
    const revokeInvitationMutation = useRevokeInvitation(activeWorkspaceId || "");

    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"member" | "viewer">("member");

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;
        
        try {
            await inviteMutation.mutateAsync({ email: inviteEmail, role: inviteRole });
            toast.success("Invitation sent!");
            setInviteEmail("");
        } catch (err: any) {
            toast.error(err.message || "Failed to send invitation");
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await updateRoleMutation.mutateAsync({ userId, role: newRole });
            toast.success("Role updated");
        } catch (err: any) {
            if (err.status === 403) {
                toast.error("You don't have permission to change roles.");
            } else {
                toast.error("Failed to update role");
            }
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;
        try {
            await removeMemberMutation.mutateAsync(userId);
            toast.success("Member removed");
        } catch (err: any) {
            if (err.status === 403) {
                toast.error("You don't have permission to remove members.");
            } else {
                toast.error("Failed to remove member");
            }
        }
    };

    const handleRevokeInvitation = async (invitationId: string) => {
        try {
            await revokeInvitationMutation.mutateAsync(invitationId);
            toast.success("Invitation revoked");
        } catch (err: any) {
             toast.error("Failed to revoke invitation");
        }
    };

    if (membersLoading || invitesLoading) {
        return (
            <div className="flex items-center justify-center min-vh-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
                    <p className="text-muted-foreground mt-1">Manage who has access to this workspace and their permissions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                        {members.length} active members
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Members List */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <div className="px-5 py-4 border-b border-border bg-muted/20">
                            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-primary" /> Active Members
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-secondary/30 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                                        <th className="px-5 py-3 border-b border-border">Name</th>
                                        <th className="px-5 py-3 border-b border-border">Role</th>
                                        <th className="px-5 py-3 border-b border-border text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {members.map((member: any) => (
                                        <tr key={member.user_id} className="group hover:bg-accent/30 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar name={member.user.full_name} src={member.user.avatar_url} size="sm" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-foreground truncate">{member.user.full_name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-medium text-foreground capitalize">{member.role}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <select 
                                                        value={member.role}
                                                        onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                                                        className="text-[10px] bg-secondary border border-border rounded px-1 py-0.5 outline-none"
                                                    >
                                                        <option value="member">Member</option>
                                                        <option value="admin">Admin</option>
                                                        <option value="viewer">Viewer</option>
                                                    </select>
                                                    <button 
                                                        onClick={() => handleRemoveMember(member.user_id)}
                                                        className="p-1 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                                                        title="Remove Member"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {invitations.length > 0 && (
                        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                            <div className="px-5 py-4 border-b border-border bg-muted/20">
                                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-amber-500" /> Pending Invitations
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-secondary/30 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                                            <th className="px-5 py-3 border-b border-border">Email</th>
                                            <th className="px-5 py-3 border-b border-border">Role</th>
                                            <th className="px-5 py-3 border-b border-border text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {invitations.map((invite: any) => (
                                            <tr key={invite.id} className="group hover:bg-accent/30 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-full bg-muted">
                                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <span className="text-sm font-medium text-foreground">{invite.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-xs text-muted-foreground capitalize">{invite.role}</span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <button 
                                                        onClick={() => handleRevokeInvitation(invite.id)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight text-destructive hover:bg-destructive/10 transition-colors"
                                                    >
                                                        <X className="h-3 w-3" /> Revoke
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Invite Sidebar */}
                <div className="space-y-6">
                    <div className="p-6 rounded-xl border border-border bg-card shadow-sm sticky top-24">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                <UserPlus className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground">Invite New Peer</h3>
                        </div>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="w-full bg-secondary/30 border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="colleague@company.com"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1.5">Workspace Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as any)}
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                >
                                    <option value="member">Member</option>
                                    <option value="viewer">Viewer</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={inviteMutation.isPending}
                                className="w-full py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                            </button>
                        </form>
                    </div>

                    <div className="p-6 rounded-xl border border-border bg-gradient-to-br from-muted/50 to-background">
                        <h3 className="text-xs font-bold text-foreground mb-3">Invitation Tip</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Once sent, the user will receive a link to join this workspace. The link is valid for 7 days.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

