import type { ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type Props = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean | undefined;
  fullWidth?: boolean | undefined;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
};

const variantMap: Record<ButtonVariant, string> = {
  primary: [
    "bg-[var(--color-accent)] text-[var(--color-text-on-accent)]",
    "hover:bg-[var(--color-accent-hover)] active:bg-[var(--color-accent-active)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1",
  ].join(" "),
  secondary: [
    "bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]",
    "border border-[var(--color-border-default)]",
    "hover:bg-[var(--color-bg-surface-hover)] active:bg-[var(--color-bg-surface-alt)]",
  ].join(" "),
  ghost: [
    "bg-transparent text-[var(--color-text-secondary)]",
    "hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-primary)]",
    "active:bg-[var(--color-bg-surface-alt)]",
  ].join(" "),
  danger: [
    "bg-[var(--color-status-error-bg)] text-[var(--color-status-error)]",
    "border border-[var(--color-status-error-border)]",
    "hover:bg-[var(--color-status-error)] hover:text-[var(--color-text-on-accent)]",
    "active:bg-[var(--color-status-error)]/80",
  ].join(" "),
};

const sizeMap: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1 text-xs rounded-md",
  md: "px-3 py-1.5 text-sm rounded-md",
  lg: "px-4 py-2 text-sm rounded-lg",
};

export function Button({
  children,
  variant = "secondary",
  size = "md",
  disabled = false,
  fullWidth = false,
  className = "",
  onClick,
  type = "button",
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center gap-1.5 font-medium",
        "transition-all duration-[var(--duration-fast)] ease-out",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-[0.98]",
        sizeMap[size],
        variantMap[variant],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
