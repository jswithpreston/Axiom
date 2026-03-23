import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { QueryProvider } from "@/providers/QueryProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Axiom",
  description: "Study Operating System",
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <QueryProvider>
          <div className="flex">
            <Sidebar />
            <main className="ml-56 flex min-h-screen flex-1 flex-col">
              {children}
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
