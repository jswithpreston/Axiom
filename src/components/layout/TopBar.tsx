"use client";

import { useMobileMenu } from "@/contexts/MobileMenuContext";

interface TopBarProps {
  readonly title: string;
  readonly subtitle?: string;
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { openMenu } = useMobileMenu();

  return (
    <header className="flex h-14 items-center justify-between border-b border-axiom-border bg-axiom-surface px-4 md:px-6">
      {/* Left: hamburger (mobile) + title */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={openMenu}
          className="-ml-1 mr-3 rounded p-1 text-axiom-muted transition-colors hover:text-axiom-text md:hidden"
          aria-label="Open navigation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="text-sm font-medium text-axiom-text">{title}</h1>
        {subtitle && (
          <span className="ml-3 hidden text-xs text-axiom-muted sm:block">
            {subtitle}
          </span>
        )}
      </div>

      {/* Right: Date and status */}
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-axiom-muted sm:block">
          {formatDate()}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-axiom-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-axiom-success" />
          <span className="hidden sm:inline">Operational</span>
        </span>
      </div>
    </header>
  );
}
