const AVATAR_COLORS = [
  "hsl(217 91% 60%)",
  "hsl(142 71% 45%)",
  "hsl(38 92% 50%)",
  "hsl(280 67% 55%)",
  "hsl(350 80% 55%)",
  "hsl(190 80% 42%)",
];

interface Props {
  name: string;
  size?: "xs" | "sm" | "md";
  color?: string;
  src?: string;
}

export default function UserAvatar({ name, size = "md", color, src }: Props) {
  const safeName = name || "Unknown";
  const initials = safeName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const hash = safeName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const bg = color || AVATAR_COLORS[hash % AVATAR_COLORS.length];

  const sizeClasses = {
    xs: "h-5 w-5 text-[8px]",
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs",
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-semibold text-primary-foreground shrink-0 overflow-hidden ${sizeClasses}`}
      style={{ backgroundColor: bg }}
      title={name}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}
