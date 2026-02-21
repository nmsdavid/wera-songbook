'use client';

import { useEffect } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { BottomNav } from '@/components/layout/bottom-nav';
import { OfflineBanner } from '@/components/layout/offline-banner';
import { useUserRole } from '@/hooks/use-user-role';
import { syncUpcomingSetlists } from '@/lib/offline/sync';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, isAdmin, loading } = useUserRole();

  useEffect(() => {
    if (!loading && user) {
      syncUpcomingSetlists();
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background">
      <OfflineBanner />
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
