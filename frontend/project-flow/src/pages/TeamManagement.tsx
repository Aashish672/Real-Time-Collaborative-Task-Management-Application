import { useState } from "react";
import { Users, Mail, ShieldCheck, MoreVertical, Plus, UserPlus } from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useWorkspaceMembers, useUpdateMemberRole, useRemoveMember } from "@/hooks/useApi";

export default function TeamManagement() {
    const { activeWorkspaceId } = useWorkspace();
    const { data: members = [], isLoading } = useWorkspaceMembers(activeWorkspaceId || undefined);
    
    const updateRoleMutation = useUpdateMemberRole(activeWorkspaceId || "");
    const removeMemberMutation = useRemoveMember(activeWorkspaceId || "");

    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"Member" | "Viewer">("Member");

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;
        
        // Mocking invitation since backend doesn't have an invite-by-email for non-existent users yet
        toast.info("Invitation feature coming soon (Backend logic needed for new users)");
        setInviteEmail("");
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Team Members</h1>
                    <p className="text-muted-foreground mt-1">Manage who has access to this workspace and their permissions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-3 overflow-hidden">
                        {members.filter(m => m.status === "active").slice(0, 5).map(m => (
                            <div key={m.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                                <UserAvatar name={m.name} size="sm" />
                            </div>
                        ))}
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                        {members.length} total members
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Members List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-secondary/30 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                                        <th className="px-5 py-3 border-b border-border">Name</th>
                                        <th className="px-5 py-3 border-b border-border">Role</th>
                                        <th className="px-5 py-3 border-b border-border">Status</th>
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
                                                    {member.role === "admin" || member.role === "owner" ? (
                                                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                                                    ) : (
                                                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                    )}
                                                    <span className="text-xs font-medium text-foreground capitalize">{member.role}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500">
                                                    Active
                                                </span>
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
                </div>

                {/* Invite Sidebar */}
                <div className="space-y-6">
                    <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                <UserPlus className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground">Invite People</h3>
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
                                        className="w-full bg-secondary/30 border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                        placeholder="colleague@company.com"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1.5">Work Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as any)}
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                >
                                    <option value="Member">Member</option>
                                    <option value="Viewer">Viewer</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
                            >
                                Send Invitation
                            </button>
                        </form>
                    </div>

                    <div className="p-6 rounded-xl border border-border bg-gradient-to-br from-secondary/30 to-background">
                        <h3 className="text-[10px] font-bold uppercase text-muted-foreground mb-3 tracking-widest">Shareable Link</h3>
                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                            Allow others to join this workspace by sharing a private link. You can reset this at any time.
                        </p>
                        <button className="flex items-center gap-2 text-xs font-bold text-primary hover:underline">
                            Copy join link
                            <Plus className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

