import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import type { Role } from "./TeamPanel";

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  { value: "owner", label: "Owner", description: "Full access, billing" },
  { value: "admin", label: "Admin", description: "Manage members & projects" },
  { value: "member", label: "Member", description: "Create & edit tasks" },
  { value: "viewer", label: "Viewer", description: "Read-only access" },
];

interface Props {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
}

export default function RoleSelect({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = ROLE_OPTIONS.find((r) => r.value === value)!;

  const roleColor: Record<Role, string> = {
    owner: "text-amber-600 bg-amber-50",
    admin: "text-primary bg-primary/10",
    member: "text-foreground bg-secondary",
    viewer: "text-muted-foreground bg-secondary",
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium sidebar-transition ${
          roleColor[value]
        } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-80 cursor-pointer"}`}
      >
        {current.label}
        {!disabled && <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-popover p-1 shadow-lg animate-fade-in">
          {ROLE_OPTIONS.filter((r) => r.value !== "owner").map((r) => (
            <button
              key={r.value}
              onClick={() => { onChange(r.value); setOpen(false); }}
              className="flex w-full items-center justify-between rounded-sm px-2.5 py-2 text-left sidebar-transition hover:bg-accent"
            >
              <div>
                <div className="text-sm font-medium text-foreground">{r.label}</div>
                <div className="text-[11px] text-muted-foreground">{r.description}</div>
              </div>
              {r.value === value && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
