import { useState } from "react";
import { X, Hash } from "lucide-react";
import { toast } from "sonner";
import { useCreateProject } from "@/hooks/useApi";

const COLORS = [
    "hsl(217 91% 60%)", // Blue
    "hsl(142 71% 45%)", // Green
    "hsl(38 92% 50%)",  // Orange
    "hsl(280 67% 55%)", // Purple
    "hsl(346 84% 61%)", // Pink
    "hsl(199 89% 48%)", // Sky
    "hsl(47 95% 55%)",  // Yellow
    "hsl(0 84% 60%)",   // Red
];

interface Props {
    open: boolean;
    workspaceId?: string;
    onClose: () => void;
    onAdd: (name: string, description: string, color: string) => void;
}

export default function CreateProjectModal({ open, workspaceId, onClose, onAdd }: Props) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState(COLORS[0]);
    const [error, setError] = useState("");

    const createProject = useCreateProject(workspaceId || "");

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!workspaceId) {
            setError("Active workspace not found.");
            return;
        }

        if (!name.trim()) {
            setError("Project name is required.");
            return;
        }

        try {
            await createProject.mutateAsync({
                name: name.trim(),
                description: description.trim(),
                color,
            });

            toast.success(`Project "${name}" created!`);

            setName("");
            setDescription("");
            setColor(COLORS[0]);
            onClose();
        } catch (err: any) {
            setError(err.data?.detail || "Failed to create project.");
        }
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
                    <h2 className="text-xl font-semibold text-foreground">New Project</h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                        Organize your tasks within a specialized project board.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Project Name
                        </label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color }} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => { setName(e.target.value); setError(""); }}
                                placeholder="e.g. Mobile App v2"
                                className="w-full rounded-lg border border-border bg-background pl-10 pr-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sidebar-transition"
                                autoFocus
                            />
                        </div>
                        {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Description <span className="text-muted-foreground font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is the goal of this project?"
                            rows={2}
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none sidebar-transition"
                        />
                    </div>

                    {/* Color Selection */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Project Color
                        </label>
                        <div className="flex flex-wrap gap-2.5">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? "border-primary ring-2 ring-primary/20" : "border-transparent"
                                        }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

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
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

