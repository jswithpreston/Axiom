"use client";

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
  return (
    <header className="flex h-14 items-center justify-between border-b border-axiom-border bg-axiom-surface px-6">
      {/* Left: Title and subtitle */}
      <div className="flex items-center">
        <h1 className="text-sm font-medium text-axiom-text">{title}</h1>
        {subtitle && (
          <span className="ml-3 text-xs text-axiom-muted">{subtitle}</span>
        )}
      </div>

      {/* Right: Date and status */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-axiom-muted">{formatDate()}</span>
        <span className="flex items-center gap-1.5 text-xs text-axiom-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-axiom-success" />
          Operational
        </span>
      </div>
    </header>
  );
}
