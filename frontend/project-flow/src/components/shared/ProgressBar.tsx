interface Props {
  value: number; // 0–100
}

export default function ProgressBar({ value }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full rounded-full bg-secondary">
      <div
        className="h-full rounded-full bg-primary sidebar-transition"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
