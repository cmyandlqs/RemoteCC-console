import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
};

const colMap = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
};

export function MetricGrid({ children, columns = 3, className = "" }: Props) {
  return (
    <div className={["grid gap-3", colMap[columns], className].join(" ")}>
      {children}
    </div>
  );
}
