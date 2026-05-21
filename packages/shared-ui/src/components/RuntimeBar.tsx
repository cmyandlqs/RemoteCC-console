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

const stateConfig: Record<RuntimeState, { label: string; dotColor: string; textColor: string }> = {
  idle: { label: "空闲", dotColor: "bg-[var(--color-status-idle)]", textColor: "text-[var(--color-text-tertiary)]" },
  running: { label: "运行中", dotColor: "bg-[var(--color-accent)]", textColor: "text-[var(--color-accent)]" },
  waiting_approval: { label: "待审批", dotColor: "bg-[var(--color-status-warning)]", textColor: "text-[var(--color-status-warning)]" },
  error: { label: "错误", dotColor: "bg-[var(--color-status-error)]", textColor: "text-[var(--color-status-error)]" },
  completed: { label: "完成", dotColor: "bg-[var(--color-status-online)]", textColor: "text-[var(--color-status-online)]" },
  stopped: { label: "停止", dotColor: "bg-[var(--color-text-muted)]", textColor: "text-[var(--color-text-muted)]" },
};

function formatTokenCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function RuntimeBar({
  model,
  inputTokens,
  outputTokens,
  costUsd,
  state = "idle",
  className = "",
}: Props) {
  const totalTokens = inputTokens != null && outputTokens != null ? inputTokens + outputTokens : null;
  const cfg = stateConfig[state];

  return (
    <div
      className={[
        "flex items-center gap-1.5 flex-wrap",
        "px-3 py-1.5",
        "bg-[var(--color-bg-inset)] rounded-t-lg",
        className,
      ].join(" ")}
    >
      <span className={["inline-flex items-center gap-1 text-[11px] font-medium", cfg.textColor].join(" ")}>
        {state === "running" ? (
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-accent)]" />
          </span>
        ) : (
          <span className={["inline-block h-1.5 w-1.5 rounded-full", cfg.dotColor].join(" ")} />
        )}
        {cfg.label}
      </span>

      {model && (
        <span className="inline-flex items-center text-[11px] font-mono text-[var(--color-text-tertiary)] bg-[var(--color-bg-surface)] rounded px-1.5 py-0.5">
          {model}
        </span>
      )}

      {totalTokens != null && costUsd != null ? (
        <span className="inline-flex items-center text-[11px] font-mono text-[var(--color-text-tertiary)] bg-[var(--color-bg-surface)] rounded px-1.5 py-0.5">
          {formatTokenCount(totalTokens)} tkn / ${parseFloat(costUsd).toFixed(2)}
        </span>
      ) : totalTokens != null ? (
        <span className="inline-flex items-center text-[11px] font-mono text-[var(--color-text-tertiary)] bg-[var(--color-bg-surface)] rounded px-1.5 py-0.5">
          {formatTokenCount(totalTokens)} tkn
        </span>
      ) : costUsd != null ? (
        <span className="inline-flex items-center text-[11px] font-mono text-[var(--color-text-tertiary)] bg-[var(--color-bg-surface)] rounded px-1.5 py-0.5">
          ${parseFloat(costUsd).toFixed(2)}
        </span>
      ) : null}
    </div>
  );
}
