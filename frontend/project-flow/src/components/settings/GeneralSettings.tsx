import { useState, useEffect } from "react";
import { useCurrentWorkspace, useUpdateWorkspace, useDeleteWorkspace } from "@/hooks/useApi";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AlertCircle, Trash2, Save, Link as LinkIcon, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GeneralSettings() {
  const { data: workspace } = useCurrentWorkspace();
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setSlug(workspace.slug);
      setLogoUrl(workspace.logo_url || "");
    }
  }, [workspace]);

  const handleUpdate = async () => {
    if (!workspace) return;
    try {
      await updateWorkspace.mutateAsync({
        workspaceId: workspace.id,
        name,
        slug,
        logo_url: logoUrl || null
      });
      toast.success("Workspace updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update workspace");
    }
  };

  const handleDelete = async () => {
    if (!workspace) return;
    if (!confirm("Are you ABSOLUTELY sure? This will delete all projects, tasks, and data in this workspace. This action cannot be undone.")) return;
    
    try {
      await deleteWorkspace.mutateAsync(workspace.id);
      toast.success("Workspace deleted");
      window.location.href = "/";
    } catch (err: any) {
      toast.error(err.message || "Failed to delete workspace");
    }
  };

  const hasChanges = workspace && (
    name !== workspace.name || 
    slug !== workspace.slug || 
    logoUrl !== (workspace.logo_url || "")
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Visual Identity */}
      <section className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Visual Identity</h3>
          <p className="text-xs text-muted-foreground">Customize how your workspace looks to others.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex flex-col items-center gap-4">
               <div className="h-24 w-24 rounded-2xl bg-secondary border border-border flex items-center justify-center overflow-hidden shadow-inner group relative">
                    {logoUrl ? (
                         <img src={logoUrl} alt="Workspace Logo" className="h-full w-full object-cover" />
                    ) : (
                         <Building2 className="h-10 w-10 text-muted-foreground/40" />
                    )}
               </div>
          </div>

          <div className="flex-1 space-y-5 w-full">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Workspace Name</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Acme Corp"
                className="bg-secondary/30"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Logo URL</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={logoUrl} 
                  onChange={(e) => setLogoUrl(e.target.value)} 
                  placeholder="https://example.com/logo.png"
                  className="pl-9 bg-secondary/30"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Provide a link to your workspace logo (square recommended).</p>
            </div>
          </div>
        </div>
      </section>

      {/* Access Settings */}
      <section className="space-y-6 pt-6 border-t border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Access & URL</h3>
          <p className="text-xs text-muted-foreground">Manage your workspace's unique identifier.</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Workspace Slug</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">projectflow.io/</span>
                <Input 
                  value={slug} 
                  onChange={(e) => setSlug(e.target.value)} 
                  className="pl-[84px] bg-secondary/30 font-mono text-xs"
                />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic">Caution: Changing your slug will break existing direct links to your workspace.</p>
        </div>
      </section>

      {/* Save Area */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={handleUpdate}
          disabled={updateWorkspace.isPending || !hasChanges}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:translate-y-0",
            !hasChanges && "scale-0 opacity-0 pointer-events-none"
          )}
        >
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>

      {/* Danger Zone */}
      <section className="pt-10 border-t border-border mt-20">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 space-y-4">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <h3 className="text-sm font-bold uppercase tracking-tight">Danger Zone</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Deleting this workspace is permanent and cannot be undone. All projects, tasks, and data associated with this workspace will be deleted forever.
          </p>
          <button 
            onClick={handleDelete}
            disabled={deleteWorkspace.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-destructive text-white text-xs font-bold rounded-xl hover:bg-destructive/90 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete Workspace
          </button>
        </div>
      </section>
    </div>
  );
}
