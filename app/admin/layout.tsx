import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin-session";
import { AdminDesktopSidebar, AdminMobileHeader } from "@/components/admin-nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin | vintaagemeew", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdmin();

  if (!authed) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* 1. Permanent Left Sidebar di Desktop (w-64) */}
      <AdminDesktopSidebar />

      {/* 2. Main Content Area & Mobile Sliding Drawer */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Mobile Header dengan tombol buka Drawer Sheet */}
        <AdminMobileHeader />

        {/* Content Canvas */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}