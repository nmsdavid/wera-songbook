'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceBannerProps {
  songId: string;
}

type PresenceState = {
  email: string;
};

export function PresenceBanner({ songId }: PresenceBannerProps) {
  const [otherEditors, setOtherEditors] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createBrowserClient();
    let channel: RealtimeChannel;

    async function setupPresence() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase.channel(`song:${songId}`, {
        config: { presence: { key: user.id } },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<PresenceState>();
          const others = Object.entries(state)
            .filter(([key]) => key !== user.id)
            .flatMap(([, presences]) => presences.map((p) => p.email));
          setOtherEditors(others);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ email: user.email ?? 'Unbekannt' });
          }
        });
    }

    setupPresence();

    return () => {
      if (channel) {
        channel.untrack();
        channel.unsubscribe();
      }
    };
  }, [songId]);

  if (otherEditors.length === 0) return null;

  return (
    <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400">
      {otherEditors.length === 1
        ? `${otherEditors[0]} bearbeitet diesen Song gerade auch.`
        : `${otherEditors.join(', ')} bearbeiten diesen Song gerade auch.`}
    </div>
  );
}
