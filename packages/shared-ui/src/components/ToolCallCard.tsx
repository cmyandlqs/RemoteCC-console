import { useState } from "react";
import type { ReactNode } from "react";

type ToolCallState = "pending" | "running" | "completed" | "error";

type Props = {
  toolName: string;
  state: ToolCallState;
  input?: ReactNode;
  output?: ReactNode;
  className?: string;
};

function safeContent(value: ReactNode): ReactNode {
  if (value == null || typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

const stateMap: Record<ToolCallState, { icon: string; label: string; bar: string; text: string }> = {
  pending: { icon: "⏳", label: "Pending", bar: "bg-[var(--color-text-muted)]", text: "text-[var(--color-text-tertiary)]" },
  running: { icon: "▸", label: "Running", bar: "bg-[var(--color-accent)]", text: "text-[var(--color-accent)]" },
  completed: { icon: "✓", label: "Completed", bar: "bg-[var(--color-status-online)]", text: "text-[var(--color-status-online)]" },
  error: { icon: "✕", label: "Error", bar: "bg-[var(--color-status-error)]", text: "text-[var(--color-status-error)]" },
};

export function ToolCallCard({ toolName, state, input, output, className = "" }: Props) {
  const style = stateMap[state];
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={[
        "relative rounded-lg bg-[var(--color-bg-inset)] overflow-hidden",
        "border border-[var(--color-border-default)]",
        className,
      ].join(" ")}
    >
      {/* Left accent bar */}
      <div className={["absolute left-0 top-0 bottom-0 w-0.5", style.bar].join(" ")} />

      <div className="pl-3 pr-4 py-3">
        {/* Header */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex items-center gap-2 w-full text-left"
        >
          <span className={["text-xs", style.text].join(" ")}>{style.icon}</span>
          <span className="font-mono text-xs text-[var(--color-text-secondary)]">
            {toolName}
          </span>
          <span className={["ml-auto text-xs font-medium", style.text].join(" ")}>
            {style.label}
          </span>
          <span className="text-xs text-[var(--color-text-muted)] transition-transform duration-[var(--duration-fast)]">
            {expanded ? "−" : "+"}
          </span>
        </button>

        {/* Expandable content */}
        {expanded && (
          <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-[var(--duration-normal)]">
            {input && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium">
                  Input
                </span>
                <pre className="mt-1 text-xs font-mono text-[var(--color-text-secondary)] bg-[var(--color-bg-base)] rounded-md p-2 overflow-x-auto">
                  {safeContent(input)}
                </pre>
              </div>
            )}
            {output && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium">
                  Output
                </span>
                <pre className="mt-1 text-xs font-mono text-[var(--color-text-secondary)] bg-[var(--color-bg-base)] rounded-md p-2 overflow-x-auto">
                  {safeContent(output)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Running pulse animation */}
        {state === "running" && !expanded && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-accent)]" />
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">Executing...</span>
          </div>
        )}
      </div>
    </div>
  );
}
