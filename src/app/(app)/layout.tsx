"use client";

import { useState } from "react";
import { QueryProvider } from "@/providers/QueryProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileMenuContext } from "@/contexts/MobileMenuContext";

export default function AppLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <QueryProvider>
      <MobileMenuContext.Provider value={{ openMenu: () => setSidebarOpen(true) }}>
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <main className="flex min-h-screen flex-1 flex-col md:ml-56">
            {children}
          </main>
        </div>
      </MobileMenuContext.Provider>
    </QueryProvider>
  );
}
