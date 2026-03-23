import { type ReactNode } from "react";
import clsx from "clsx";

type BadgeVariant = "low" | "medium" | "high" | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  low: "bg-green-500/10 text-green-400",
  medium: "bg-amber-500/10 text-amber-400",
  high: "bg-red-500/10 text-red-400",
  default: "bg-gray-500/10 text-gray-400",
};

export default function Badge({
  variant = "default",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
