type Props = {
  rows?: number;
  className?: string;
};

export function LoadingState({ rows = 3, className = "" }: Props) {
  return (
    <div className={["space-y-3 animate-pulse", className].join(" ")}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-[var(--color-bg-inset)]"
          style={{ width: `${100 - (i % 3) * 15}%` }}
        />
      ))}
    </div>
  );
}
