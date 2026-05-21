import type { ReactNode } from "react";

export type RuntimeState = "idle" | "running" | "waiting_approval" | "error" | "completed" | "stopped";

type Props = {
  model?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  costUsd?: string | null;
  contextWindow?: number | null;
  state?: RuntimeState;
  className?: string;
};

const stateLabels: Record<RuntimeState, string> = {
  idle: "Idle",
  running: "Running",
  waiting_approval: "Waiting",
  error: "Error",
  completed: "Completed",
  stopped: "Stopped",
};

export function RuntimeBar({
  model,
  inputTokens,
  outputTokens,
  costUsd,
  contextWindow,
  state = "idle",
  className = "",
}: Props) {
  const totalTokens = inputTokens != null && outputTokens != null ? inputTokens + outputTokens : null;

  return (
    <div
      className={[
        "flex items-center gap-3 flex-wrap",
        "px-4 py-2",
        "bg-[var(--color-bg-surface)] border-b border-[var(--color-border-subtle)]",
        className,
      ].join(" ")}
    >
      {/* State */}
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
        {state === "running" && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-accent)]" />
          </span>
        )}
        <span className={state === "running" ? "text-[var(--color-accent)]" : ""}>
          {stateLabels[state]}
        </span>
      </span>

      {/* Separator */}
      <span className="h-3 w-px bg-[var(--color-border-default)]" />

      {/* Model */}
      {model && (
        <span className="text-xs font-mono text-[var(--color-text-tertiary)]">
          {model}
        </span>
      )}

      {/* Separator */}
      {model && totalTokens != null && <span className="h-3 w-px bg-[var(--color-border-default)]" />}

      {/* Tokens */}
      {totalTokens != null && (
        <span className="text-xs font-mono text-[var(--color-text-tertiary)]">
          {totalTokens.toLocaleString()} tok
        </span>
      )}

      {/* Cost */}
      {costUsd != null && (
        <span className="text-xs font-mono text-[var(--color-text-tertiary)]">
          ${parseFloat(costUsd).toFixed(4)}
        </span>
      )}

      {/* Context */}
      {contextWindow != null && (
        <span className="text-xs font-mono text-[var(--color-text-tertiary)]">
          ctx {contextWindow.toLocaleString()}
        </span>
      )}
    </div>
  );
}
