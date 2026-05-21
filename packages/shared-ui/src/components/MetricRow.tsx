import type { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  mono?: boolean;
  className?: string;
};

export function MetricRow({ label, value, mono = false, className = "" }: Props) {
  return (
    <div className={["flex items-center justify-between gap-4", className].join(" ")}>
      <span className="text-xs text-[var(--color-text-tertiary)]">{label}</span>
      <span className={["text-sm font-medium text-[var(--color-text-primary)]", mono ? "font-mono" : ""].join(" ")}>
        {value}
      </span>
    </div>
  );
}
