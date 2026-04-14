import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface Props {
    open: boolean;
    onClose: () => void;
    onAdd: (name: string, slug: string, description: string) => void;
}

import { useCreateWorkspace } from "@/hooks/useApi";

export default function CreateWorkspaceModal({ open, onClose, onAdd }: Props) {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [isAutoSlug, setIsAutoSlug] = useState(true);
    const [error, setError] = useState("");

    const createWorkspace = useCreateWorkspace();

    // Auto-generate slug from name
    useEffect(() => {
        if (isAutoSlug) {
            const generated = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
            setSlug(generated);
        }
    }, [name, isAutoSlug]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Workspace name is required.");
            return;
        }
        if (!slug.trim()) {
            setError("Valid slug is required.");
            return;
        }

        try {
            await createWorkspace.mutateAsync({
                name: name.trim(),
                slug: slug.trim(),
                description: description.trim(),
            });

            toast.success(`Workspace "${name}" created successfully!`);
            
            // Reset and close
            setName("");
            setSlug("");
            setDescription("");
            setIsAutoSlug(true);
            onClose();
        } catch (err: any) {
            setError(err.data?.detail || "Failed to create workspace. Try another slug?");
        }
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSlug(e.target.value);
        if (isAutoSlug) setIsAutoSlug(false); // User manually edited, stop auto-gen
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent sidebar-transition"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-foreground">Create Workspace</h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                        Workspaces are where your team collaborates on projects.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setError(""); }}
                            placeholder="e.g. Acme Marketing"
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sidebar-transition"
                            autoFocus
                        />
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center justify-between">
                            <span>URL Slug</span>
                            <span className="text-[10px] text-muted-foreground">projectflow.io/{slug || "..."}</span>
                        </label>
                        <input
                            type="text"
                            value={slug}
                            onChange={handleSlugChange}
                            placeholder="workspace-unique-name"
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono sidebar-transition"
                        />
                        {isAutoSlug && name && (
                            <p className="mt-1 text-[10px] text-primary/70">Generated automatically from name</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Description <span className="text-muted-foreground font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this workspace about?"
                            rows={3}
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none sidebar-transition"
                        />
                    </div>

                    {error && (
                        <div className="p-2.5 rounded-md bg-destructive/10 text-destructive text-xs font-medium">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground sidebar-transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20 sidebar-transition"
                        >
                            Create Workspace
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

