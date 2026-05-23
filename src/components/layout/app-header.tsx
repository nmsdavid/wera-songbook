'use client';

import { LogOut, User } from 'lucide-react';
import { logout } from '@/app/(auth)/login/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MobileNavSheet } from './mobile-nav-sheet';
import type { AppRole } from '@/types/database';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type AppHeaderProps = {
  user: SupabaseUser | null;
  role: AppRole | null;
  isAdmin: boolean;
};

const roleLabels: Record<AppRole, string> = {
  admin: 'Administrator',
  leader: 'Leiter',
  member: 'Mitglied',
};

export function AppHeader({ user, role, isAdmin }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-14 items-center gap-2 px-4">
        <MobileNavSheet isAdmin={isAdmin} />
        <h1 className="text-lg font-semibold">WERA Songbook</h1>

        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]">
                <User className="h-5 w-5" />
                <span className="sr-only">Benutzermenu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium truncate">
                  {user?.email ?? 'Unbekannt'}
                </p>
                {role && (
                  <p className="text-xs text-muted-foreground">
                    {roleLabels[role]}
                  </p>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <form action={logout}>
                <DropdownMenuItem
                  asChild
                  onSelect={(e) => e.preventDefault()}
                  className="min-h-[48px]"
                >
                  <button type="submit" className="w-full cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Abmelden
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
