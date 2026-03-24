"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: React.ReactNode;
}

interface SidebarProps {
  readonly isOpen?: boolean;
  readonly onClose?: () => void;
}

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function CoursesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function FlashcardsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 3H8l-2 4h12l-2-4z" />
    </svg>
  );
}

function ReviewsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6" />
      <path d="M2.5 22v-6h6" />
      <path d="M21.1 8A9 9 0 0 0 5.3 5.3L2.5 8" />
      <path d="M2.9 16a9 9 0 0 0 15.8 2.7l2.8-2.7" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08z" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon /> },
  { label: "Courses", href: "/courses", icon: <CoursesIcon /> },
  { label: "Flashcards", href: "/flashcards", icon: <FlashcardsIcon /> },
  { label: "Reviews", href: "/reviews", icon: <ReviewsIcon /> },
  { label: "Analytics", href: "/analytics", icon: <AnalyticsIcon /> },
];

const bottomNavItems: NavItem[] = [
  { label: "Settings", href: "/settings", icon: <SettingsIcon /> },
];

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-axiom-border bg-axiom-surface transition-transform duration-200 ease-in-out -translate-x-full md:translate-x-0 ${
        isOpen ? "translate-x-0" : ""
      }`}
    >
      {/* Close button — mobile only */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 rounded p-1 text-axiom-muted transition-colors hover:text-axiom-text md:hidden"
        aria-label="Close navigation"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Logo */}
      <div className="px-4 pb-6 pt-6">
        <div className="font-mono text-lg font-bold tracking-[0.3em] text-axiom-text">
          AXIOM
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-axiom-muted">
          STUDY SYSTEM
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {mainNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
              isActive(item.href)
                ? "border-r-2 border-axiom-accent bg-axiom-accent/10 text-axiom-accent"
                : "text-axiom-muted hover:text-axiom-text"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom navigation + sign out */}
      <div className="px-2 pb-4">
        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
              isActive(item.href)
                ? "border-r-2 border-axiom-accent bg-axiom-accent/10 text-axiom-accent"
                : "text-axiom-muted hover:text-axiom-text"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}

        <div className="mt-2 border-t border-axiom-border px-2 pt-3">
          {session?.user?.email && (
            <p className="mb-2 truncate text-[11px] text-axiom-muted">
              {session.user.email}
            </p>
          )}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded px-2 py-2 text-sm text-axiom-muted transition-colors hover:text-axiom-text"
          >
            <SignOutIcon />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
