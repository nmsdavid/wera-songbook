'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music, ListMusic, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

type BottomNavProps = {
  isAdmin: boolean;
};

const navItems = [
  { href: '/songs', label: 'Songs', icon: Music },
  { href: '/setlists', label: 'Setlists', icon: ListMusic },
];

const adminItem = { href: '/admin', label: 'Verwaltung', icon: Settings };

export function BottomNav({ isAdmin }: BottomNavProps) {
  const pathname = usePathname();
  const items = isAdmin ? [...navItems, adminItem] : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary',
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
