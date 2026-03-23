"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-axiom-accent text-white hover:bg-axiom-accent/90 active:bg-axiom-accent-dim",
  secondary:
    "bg-axiom-surface text-axiom-text border border-axiom-border hover:bg-axiom-border/50 active:bg-axiom-border",
  danger:
    "bg-axiom-danger text-white hover:bg-axiom-danger/90 active:bg-red-700",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  children,
  onClick,
  type = "button",
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-axiom-accent focus-visible:ring-offset-2 focus-visible:ring-offset-axiom-bg",
        variantStyles[variant],
        sizeStyles[size],
        (disabled || loading) && "cursor-not-allowed opacity-50",
        className
      )}
      {...rest}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
