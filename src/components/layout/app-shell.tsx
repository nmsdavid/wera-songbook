'use client';

import { useEffect } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { BottomNav } from '@/components/layout/bottom-nav';
import { OfflineBanner } from '@/components/layout/offline-banner';
import { UserRoleProvider, type UserRoleState } from '@/hooks/use-user-role';
import { syncUpcomingSetlists } from '@/lib/offline/sync';

export function AppShell({
  userRole,
  children,
}: {
  userRole: UserRoleState;
  children: React.ReactNode;
}) {
  useEffect(() => {
    syncUpcomingSetlists();
  }, []);

  return (
    <UserRoleProvider value={userRole}>
      <div className="min-h-svh bg-background">
        <OfflineBanner />
        <AppHeader
          email={userRole.email}
          role={userRole.role}
          isAdmin={userRole.isAdmin}
        />

        <div className="flex">
          {/* Desktop sidebar */}
          <aside className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:border-r">
            <SidebarNav isAdmin={userRole.isAdmin} />
          </aside>

          {/* Main content */}
          <main className="flex-1 pb-16 lg:pb-0">
            {children}
          </main>
        </div>

        {/* Mobile bottom nav */}
        <BottomNav isAdmin={userRole.isAdmin} />
      </div>
    </UserRoleProvider>
  );
}
