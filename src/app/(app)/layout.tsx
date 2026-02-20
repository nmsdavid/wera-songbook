'use client';

import { AppHeader } from '@/components/layout/app-header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { BottomNav } from '@/components/layout/bottom-nav';
import { useUserRole } from '@/hooks/use-user-role';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, isAdmin, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background">
      <AppHeader user={user} role={role} isAdmin={isAdmin} />

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:border-r">
          <SidebarNav isAdmin={isAdmin} />
        </aside>

        {/* Main content */}
        <main className="flex-1 pb-16 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
