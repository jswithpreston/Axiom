import { type ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Card({ title, children, className }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-axiom-border bg-axiom-surface p-6",
        className
      )}
    >
      {title && (
        <h3 className="mb-4 text-sm uppercase tracking-wider text-axiom-muted">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
