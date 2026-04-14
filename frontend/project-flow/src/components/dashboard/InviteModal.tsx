import { useState } from "react";
import { X } from "lucide-react";
import type { Role } from "./TeamPanel";

const INVITE_ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: Role) => void;
}

export default function InviteModal({ open, onClose, onInvite }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (trimmed.length > 255) {
      setError("Email must be less than 255 characters.");
      return;
    }

    onInvite(trimmed, role);
    setEmail("");
    setRole("member");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl animate-fade-in">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent sidebar-transition"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-base font-semibold text-foreground">Invite Colleague</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Send an invitation to join this workspace.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="colleague@company.com"
              maxLength={255}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Role
            </label>
            <div className="flex gap-2">
              {INVITE_ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium sidebar-transition ${
                    role === r.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground sidebar-transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sidebar-transition"
            >
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
