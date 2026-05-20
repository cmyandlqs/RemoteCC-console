import type { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  variant?: "default" | "success" | "warning" | "error";
};

export function StatusBadge({ label, value, variant = "default" }: Props) {
  return (
    <div className={`metric-card metric-card--${variant}`}>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}