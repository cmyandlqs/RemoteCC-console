import type { ReactNode } from "react";
import { Button } from "./Button";

type Props = {
  toolName: string;
  description?: string;
  commandPreview?: string;
  riskLevel?: "low" | "medium" | "high";
  onStop?: () => void;
  isLoading?: boolean | undefined;
  className?: string;
};

const riskMap = {
  low: { label: "Low Risk", bar: "bg-[var(--color-status-online)]" },
  medium: { label: "Medium Risk", bar: "bg-[var(--color-status-warning)]" },
  high: { label: "High Risk", bar: "bg-[var(--color-status-error)]" },
};

export function ApprovalCard({
  toolName,
  description,
  commandPreview,
  riskLevel = "medium",
  onStop,
  isLoading,
  className = "",
}: Props) {
  const risk = riskMap[riskLevel];

  return (
    <div
      className={[
        "relative rounded-lg bg-[var(--color-status-warning-bg)]",
        "border border-[var(--color-status-warning-border)]",
        "overflow-hidden",
        className,
      ].join(" ")}
    >
      {/* Risk bar */}
      <div className={["h-1 w-full", risk.bar].join(" ")} />

      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-status-warning)]">
            Permission Request
          </span>
          <span className="text-xs text-[var(--color-text-tertiary)]">· {risk.label}</span>
        </div>

        {/* Tool name */}
        <div className="font-mono text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-status-warning-border)]/20 rounded-md px-2 py-1 inline-block">
          {toolName}
        </div>

        {/* Description */}
        {description && (
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {description}
          </p>
        )}

        {/* Command preview */}
        {commandPreview && (
          <div className="mt-3">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium">
              Command
            </span>
            <pre className="mt-1 text-xs font-mono text-[var(--color-text-secondary)] bg-[var(--color-bg-base)]/60 rounded-md p-2.5 overflow-x-auto border border-[var(--color-status-warning-border)]/50">
              {commandPreview}
            </pre>
          </div>
        )}

        {/* Action */}
        {onStop && (
          <div className="mt-3">
            <Button
              variant="danger"
              size="md"
              fullWidth
              disabled={isLoading}
              onClick={onStop}
            >
              {isLoading ? "Stopping..." : "Stop Session"}
            </Button>
            <p className="mt-1.5 text-[11px] text-[var(--color-text-tertiary)] text-center">
              Stopping will terminate the running session. Return to host to continue.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
