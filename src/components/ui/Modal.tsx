"use client";

import { type ReactNode, useEffect, useCallback } from "react";
import clsx from "clsx";

type ModalSize = "sm" | "md" | "lg";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: ModalSize;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal box */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={clsx(
          "relative z-10 w-full rounded-lg border border-axiom-border bg-axiom-surface shadow-2xl",
          "animate-in fade-in zoom-in-95 duration-200",
          sizeStyles[size],
          "mx-4"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-axiom-border px-6 py-4">
          <h2
            id="modal-title"
            className="text-base font-semibold text-axiom-text"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-axiom-muted transition-colors duration-150 hover:bg-axiom-border hover:text-axiom-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-axiom-accent"
            aria-label="Close modal"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
