import { type InputHTMLAttributes, forwardRef } from "react";

export type InputSize = "sm" | "md" | "lg";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: InputSize;
};

const sizeMap: Record<InputSize, string> = {
  sm: "px-2.5 py-1.5 text-xs rounded-md",
  md: "px-3 py-2 text-sm rounded-md",
  lg: "px-4 py-2.5 text-sm rounded-lg",
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { size = "md", className = "", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={[
        "w-full",
        "bg-[var(--color-bg-inset)] text-[var(--color-text-primary)]",
        "border border-[var(--color-border-input)]",
        "placeholder:text-[var(--color-text-muted)]",
        "focus:border-[var(--color-border-focus)] focus:ring-1 focus:ring-[var(--color-border-focus)]",
        "transition-colors duration-[var(--duration-fast)]",
        sizeMap[size],
        className,
      ].join(" ")}
      {...props}
    />
  );
});
