import type { KeyboardEvent, ReactNode } from "react";

type Props = {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  border?: boolean;
  shadow?: "none" | "xs" | "sm";
  hover?: boolean;
  className?: string;
  onClick?: () => void;
};

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

const shadowMap = {
  none: "",
  xs: "shadow-[var(--shadow-xs)]",
  sm: "shadow-[var(--shadow-sm)]",
};

export function Card({
  children,
  padding = "md",
  border = true,
  shadow = "xs",
  hover = false,
  className = "",
  onClick,
}: Props) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      className={[
        "rounded-lg bg-[var(--color-bg-surface)]",
        border ? "border border-[var(--color-border-default)]" : "",
        shadowMap[shadow],
        paddingMap[padding],
        hover ? "cursor-pointer transition-shadow duration-[var(--duration-normal)] hover:shadow-[var(--shadow-md)]" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
