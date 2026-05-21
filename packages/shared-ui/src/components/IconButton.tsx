import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  label?: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
};

export function IconButton({ children, label, disabled = false, className = "", onClick }: Props) {
  return (
    <button
      type="button"
      {...(label ? { "aria-label": label } : {})}
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center",
        "w-8 h-8 rounded-md",
        "text-[var(--color-text-secondary)]",
        "hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-primary)]",
        "active:scale-[0.96]",
        "transition-all duration-[var(--duration-fast)]",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
