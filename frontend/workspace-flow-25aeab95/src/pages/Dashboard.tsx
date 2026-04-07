import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, LayoutGrid, MoreHorizontal, Pencil, Trash2, UserPlus, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import TopNav from "@/components/layout/TopNav";
import { workspaces as initialWorkspaces, boards, users } from "@/data/mockData";
import { Workspace, User } from "@/types";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [workspaceList, setWorkspaceList] = useState<Workspace[]>(initialWorkspaces);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [wsName, setWsName] = useState("");
  const [wsDesc, setWsDesc] = useState("");
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberWorkspace, setMemberWorkspace] = useState<Workspace | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");

  const openCreateWorkspace = () => {
    setEditingWorkspace(null);
    setWsName("");
    setWsDesc("");
    setShowWorkspaceModal(true);
  };

  const openEditWorkspace = (ws: Workspace) => {
    setEditingWorkspace(ws);
    setWsName(ws.name);
    setWsDesc(ws.description);
    setShowWorkspaceModal(true);
  };

  const handleSaveWorkspace = () => {
    if (!wsName.trim()) return;
    if (editingWorkspace) {
      setWorkspaceList((prev) => prev.map((w) => w.id === editingWorkspace.id ? { ...w, name: wsName, description: wsDesc } : w));
      toast.success("Workspace updated");
    } else {
      const newWs: Workspace = { id: `w${Date.now()}`, name: wsName, description: wsDesc, members: [users[0]], boards: [], createdAt: new Date().toISOString() };
      setWorkspaceList((prev) => [...prev, newWs]);
      toast.success("Workspace created");
    }
    setShowWorkspaceModal(false);
  };

  const deleteWorkspace = (id: string) => {
    setWorkspaceList((prev) => prev.filter((w) => w.id !== id));
    toast.success("Workspace deleted");
  };

  const openMembers = (ws: Workspace) => {
    setMemberWorkspace(ws);
    setInviteEmail("");
    setShowMemberModal(true);
  };

  const handleInvite = () => {
    if (!inviteEmail.trim() || !memberWorkspace) return;
    const newMember: User = { id: `u${Date.now()}`, name: inviteEmail.split("@")[0], email: inviteEmail, avatar: "", initials: inviteEmail.slice(0, 2).toUpperCase() };
    setWorkspaceList((prev) => prev.map((w) => w.id === memberWorkspace.id ? { ...w, members: [...w.members, newMember] } : w));
    setMemberWorkspace((prev) => prev ? { ...prev, members: [...prev.members, newMember] } : null);
    setInviteEmail("");
    toast.success(`Invited ${inviteEmail}`);
  };

  const removeMember = (userId: string) => {
    if (!memberWorkspace) return;
    setWorkspaceList((prev) => prev.map((w) => w.id === memberWorkspace.id ? { ...w, members: w.members.filter((m) => m.id !== userId) } : w));
    setMemberWorkspace((prev) => prev ? { ...prev, members: prev.members.filter((m) => m.id !== userId) } : null);
  };

  const recentBoards = boards.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <TopNav title="Dashboard" />
      <main className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
        {/* Recent Boards */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Recent Boards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentBoards.map((board) => (
              <Card key={board.id} onClick={() => navigate(`/board/${board.id}`)} className="cursor-pointer hover:shadow-md transition-shadow group border-border/50">
                <div className="h-2 rounded-t-lg" style={{ backgroundColor: `hsl(${board.color})` }} />
                <CardContent className="pt-4 pb-4">
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{board.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated {new Date(board.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Workspaces */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Workspaces</h2>
            <Button onClick={openCreateWorkspace} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> New Workspace
            </Button>
          </div>
          <div className="space-y-4">
            {workspaceList.map((ws) => (
              <Card key={ws.id} className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                        {ws.name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{ws.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{ws.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openMembers(ws)}>
                        <Users className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditWorkspace(ws)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteWorkspace(ws.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex -space-x-2">
                      {ws.members.slice(0, 4).map((m) => (
                        <Avatar key={m.id} className="h-6 w-6 border-2 border-card">
                          <AvatarFallback className="text-[9px] bg-secondary">{m.initials}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{ws.members.length} member{ws.members.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {ws.boards.map((board) => (
                      <button key={board.id} onClick={() => navigate(`/board/${board.id}`)} className="flex items-center gap-2.5 rounded-lg border border-border/50 p-3 text-left hover:bg-accent transition-colors">
                        <LayoutGrid className="h-4 w-4 shrink-0" style={{ color: `hsl(${board.color})` }} />
                        <span className="text-sm font-medium truncate">{board.name}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Create/Edit Workspace Modal */}
      <Dialog open={showWorkspaceModal} onOpenChange={setShowWorkspaceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWorkspace ? "Edit Workspace" : "Create Workspace"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={wsName} onChange={(e) => setWsName(e.target.value)} placeholder="My Workspace" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={wsDesc} onChange={(e) => setWsDesc(e.target.value)} placeholder="What's this workspace for?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWorkspaceModal(false)}>Cancel</Button>
            <Button onClick={handleSaveWorkspace}>{editingWorkspace ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Management Modal */}
      <Dialog open={showMemberModal} onOpenChange={setShowMemberModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Members — {memberWorkspace?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@example.com" className="flex-1" />
              <Button onClick={handleInvite} size="sm" className="gap-1.5 shrink-0">
                <UserPlus className="h-4 w-4" /> Invite
              </Button>
            </div>
            <Separator />
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {memberWorkspace?.members.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-secondary">{m.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeMember(m.id)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
