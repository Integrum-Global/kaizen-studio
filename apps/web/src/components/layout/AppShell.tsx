import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileSidebar } from "./MobileSidebar";
import { SkipLink } from "@/components/shared";
import { HelpDialog } from "@/features/help";

export function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Skip to main content link for keyboard navigation */}
      <SkipLink />

      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex" aria-label="Main navigation">
          <Sidebar />
        </aside>

        {/* Mobile Sidebar */}
        <MobileSidebar open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <Header onMenuClick={() => setMobileMenuOpen(true)} />

          {/* Page Content - Responsive padding: mobile (16px), tablet (24px), desktop (32px) */}
          <main
            id="main-content"
            className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
          >
            <Outlet />
          </main>
        </div>
      </div>

      {/* Help Dialog - Global, opens with F1 or help button */}
      <HelpDialog />
    </>
  );
}
