type Props = {
  message?: string;
  retry?: () => void;
  className?: string;
};

export function ErrorState({ message, retry, className = "" }: Props) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center text-center",
        "py-6 px-4 rounded-lg",
        "bg-[var(--color-status-error-bg)] border border-[var(--color-status-error-border)]",
        className,
      ].join(" ")}
    >
      <p className="text-sm font-medium text-[var(--color-status-error)]">
        {message ?? "加载失败"}
      </p>
      {retry && (
        <button
          type="button"
          onClick={retry}
          className="mt-2 text-xs text-[var(--color-status-error)] underline underline-offset-2 hover:no-underline"
        >
          重试
        </button>
      )}
    </div>
  );
}
