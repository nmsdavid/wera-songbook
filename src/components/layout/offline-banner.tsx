'use client';

import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-yellow-600/90 px-4 py-2 text-sm font-medium text-white">
      <WifiOff className="h-4 w-4" />
      Du bist offline – Änderungen nicht möglich
    </div>
  );
}
