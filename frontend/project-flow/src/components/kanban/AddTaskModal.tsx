import { useState } from "react";
import { X } from "lucide-react";
import type { Priority } from "@/types/kanban";
import UserAvatar from "@/components/shared/UserAvatar";

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "none", label: "None" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (title: string, priority: Priority, labelIds: string[], assigneeIds: string[]) => void;
  members: any[];
  labels: any[];
}

export default function AddTaskModal({ open, onClose, onAdd, members, labels }: Props) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [error, setError] = useState("");

  if (!open) return null;

  const toggleLabel = (id: string) => {
    setSelectedLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) { setError("Title is required."); return; }
    
    onAdd(trimmed, priority, selectedLabels, selectedAssignees);
    setTitle(""); setPriority("medium"); setSelectedLabels([]); setSelectedAssignees([]); setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl animate-fade-in">
        <button onClick={onClose} className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent sidebar-transition">
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-base font-semibold text-foreground">New Task</h2>
        <p className="mt-1 text-sm text-muted-foreground">Add a task to the To Do column.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(""); }}
              placeholder="What needs to be done?"
              maxLength={200}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium sidebar-transition ${
                    priority === p.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Labels</label>
            <div className="flex flex-wrap gap-1.5">
              {labels.map((l: any) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => toggleLabel(l.id)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium sidebar-transition ${
                    selectedLabels.includes(l.id)
                      ? "border-transparent"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                  style={
                    selectedLabels.includes(l.id)
                      ? { backgroundColor: `${l.color}20`, color: l.color, borderColor: `${l.color}40` }
                      : undefined
                  }
                >
                  {l.name}
                </button>
              ))}
              {labels.length === 0 && <p className="text-xs text-muted-foreground italic">No labels created yet.</p>}
            </div>
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Assignees</label>
            <div className="max-h-32 overflow-y-auto space-y-1 p-1 border border-border rounded-md bg-secondary/20">
              {members.map((m: any) => (
                <label key={m.user_id} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={selectedAssignees.includes(m.user_id)}
                        onChange={(e) => {
                            if (e.target.checked) setSelectedAssignees([...selectedAssignees, m.user_id]);
                            else setSelectedAssignees(selectedAssignees.filter(id => id !== m.user_id));
                        }}
                        className="rounded border-border"
                    />
                    <UserAvatar name={m.user.full_name} src={m.user.avatar_url} size="xs" />
                    <span className="text-xs text-foreground font-medium">{m.user.full_name}</span>
                </label>
              ))}
              {members.length === 0 && <p className="text-xs text-muted-foreground p-2">No members in workspace.</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground sidebar-transition">
              Cancel
            </button>
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sidebar-transition font-bold">
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
