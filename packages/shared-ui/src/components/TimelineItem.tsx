import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  kind?: "user" | "agent" | "thinking" | "system" | "tool";
  className?: string;
};

const kindMap = {
  user: "justify-end",
  agent: "justify-start",
  thinking: "justify-start",
  system: "justify-center",
  tool: "justify-start",
};

export function TimelineItem({ children, kind = "agent", className = "" }: Props) {
  return (
    <div
      className={[
        "flex w-full animate-in fade-in duration-[var(--duration-normal)]",
        kindMap[kind],
        className,
      ].join(" ")}
    >
      <div
        className={[
          "max-w-[85%]",
          kind === "user" ? "bg-[var(--color-accent-subtle)] rounded-2xl rounded-tr-sm px-4 py-3" : "",
          kind === "agent" ? "px-1 py-2" : "",
          kind === "thinking" ? "text-[var(--color-text-tertiary)] italic text-sm px-1" : "",
          kind === "system" ? "text-[var(--color-text-muted)] text-xs px-1" : "",
          kind === "tool" ? "w-full max-w-full" : "",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
