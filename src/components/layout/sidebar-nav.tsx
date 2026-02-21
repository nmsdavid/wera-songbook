'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music, ListMusic, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

type SidebarNavProps = {
  isAdmin: boolean;
  onNavigate?: () => void;
};

const navItems = [
  { href: '/songs', label: 'Songs', icon: Music },
  { href: '/setlists', label: 'Setlists', icon: ListMusic },
];

const adminItem = { href: '/admin', label: 'Verwaltung', icon: Settings };

export function SidebarNav({ isAdmin, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const items = isAdmin ? [...navItems, adminItem] : navItems;

  return (
    <nav className="flex flex-col gap-1 p-2">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-[48px]',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground',
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
