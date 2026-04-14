import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface Props<T extends string> {
  label: string;
  options: { value: T; label: string; color?: string }[];
  value: T | null;
  onChange: (v: T | null) => void;
}

export default function FilterDropdown<T extends string>({ label, options, value, onChange }: Props<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium sidebar-transition ${
          value
            ? "border-primary/30 bg-primary/5 text-primary"
            : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        {selected ? selected.label : label}
        {value ? (
          <X
            className="h-3 w-3 hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false); }}
          />
        ) : (
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-md border border-border bg-popover p-1 shadow-lg animate-fade-in">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-sm sidebar-transition hover:bg-accent ${
                o.value === value ? "text-primary font-medium" : "text-foreground"
              }`}
            >
              {o.color && (
                <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: o.color }} />
              )}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
