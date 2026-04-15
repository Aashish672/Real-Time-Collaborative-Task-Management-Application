import { useState } from "react";
import { X, Plus, Trash2, Check, Loader2 } from "lucide-react";
import { type Label } from "@/types/kanban";
import { toast } from "sonner";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useWorkspaceLabels, useCreateLabel, useUpdateLabel, useDeleteLabel } from "@/hooks/useApi";

const COLORS = [
    "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
    "#06b6d4", "#facc15", "#ef4444", "#64748b"
];

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function LabelManagementModal({ open, onClose }: Props) {
    const { activeWorkspaceId } = useWorkspace();
    const { data: labels = [], isLoading } = useWorkspaceLabels(activeWorkspaceId || undefined);
    
    const createLabel = useCreateLabel(activeWorkspaceId || "");
    const updateLabel = useUpdateLabel(activeWorkspaceId || "");
    const deleteLabel = useDeleteLabel(activeWorkspaceId || "");

    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState("");
    const [newColor, setNewColor] = useState(COLORS[0]);
    const [isAdding, setIsAdding] = useState(false);

    if (!open) return null;

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !activeWorkspaceId) return;

        try {
            await createLabel.mutateAsync({
                name: newName.trim(),
                color: newColor
            });
            setNewName("");
            setIsAdding(false);
            toast.success("Label created");
        } catch (error) {
            toast.error("Failed to create label");
        }
    };

    const handleDelete = async (id: string) => {
        if (!activeWorkspaceId) return;
        try {
            await deleteLabel.mutateAsync(id);
            toast.success("Label deleted");
        } catch (error) {
            toast.error("Failed to delete label");
        }
    };

    const startEdit = (label: Label) => {
        setEditingId(label.id);
        setNewName(label.name);
        setNewColor(label.color);
    };

    const handleSaveEdit = async () => {
        if (!editingId || !newName.trim() || !activeWorkspaceId) return;
        try {
            await updateLabel.mutateAsync({
                labelId: editingId,
                name: newName.trim(),
                color: newColor
            });
            setEditingId(null);
            setNewName("");
            toast.success("Label updated");
        } catch (error) {
            toast.error("Failed to update label");
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent sidebar-transition"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-foreground">Manage Labels</h2>
                    <p className="mt-1 text-sm text-muted-foreground text-pretty">
                        Use labels to categorize and filter your project tasks.
                    </p>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : labels.length === 0 ? (
                        <p className="text-center py-10 text-sm text-muted-foreground italic">No labels created yet.</p>
                    ) : (
                        labels.map((label: any) => (
                            <div key={label.id} className="flex items-center gap-3 p-2 rounded-lg border border-border/50 bg-secondary/10 group">
                                {editingId === label.id ? (
                                    <div className="flex-1 flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="flex-1 min-w-0 bg-background border border-border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary outline-none"
                                            autoFocus
                                        />
                                        <div className="flex gap-1">
                                            {COLORS.slice(0, 5).map(c => (
                                                <button key={c} onClick={() => setNewColor(c)} className={`h-4 w-4 rounded-full border ${newColor === c ? "ring-1 ring-primary" : "border-transparent"}`} style={{ backgroundColor: c }} />
                                            ))}
                                        </div>
                                        <button 
                                            onClick={handleSaveEdit} 
                                            disabled={updateLabel.isPending}
                                            className="p-1 rounded hover:bg-primary/20 text-primary disabled:opacity-50"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                                        <span className="flex-1 text-sm font-medium text-foreground truncate">{label.name}</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 sidebar-transition">
                                            <button onClick={() => startEdit(label)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent">
                                                <Plus className="h-3.5 w-3.5 rotate-45" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(label.id)}
                                                disabled={deleteLabel.isPending}
                                                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {isAdding ? (
                    <form onSubmit={handleAdd} className="mt-6 p-4 rounded-lg bg-secondary/20 border border-primary/20 space-y-4">
                        <div className="flex items-center gap-3">
                            <input
                                placeholder="Label name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="flex-1 bg-background border border-border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none text-foreground"
                                autoFocus
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map(c => (
                                <button key={c} type="button" onClick={() => setNewColor(c)} className={`h-5 w-5 rounded-full border-2 ${newColor === c ? "border-primary scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                            ))}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">Cancel</button>
                            <button 
                                type="submit" 
                                disabled={createLabel.isPending}
                                className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded hover:bg-primary/90 disabled:opacity-50"
                            >
                                {createLabel.isPending ? "Creating..." : "Add Label"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                        onClick={() => { setIsAdding(true); setEditingId(null); setNewName(""); setNewColor(COLORS[0]); }}
                        className="w-full mt-6 py-2.5 flex items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 sidebar-transition"
                    >
                        <Plus className="h-4 w-4" />
                        Create New Label
                    </button>
                )}
            </div>
        </div>
    );
}

