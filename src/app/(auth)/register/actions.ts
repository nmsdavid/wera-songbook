'use server';

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export type RegisterState = {
  error: string | null;
};

export async function signup(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email = (formData.get('email') as string | null)?.trim() ?? '';
  const password = formData.get('password') as string | null;
  const displayName = (formData.get('displayName') as string | null)?.trim() ?? '';

  if (!email || !password) {
    return { error: 'Bitte E-Mail und Passwort eingeben.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Bitte eine gültige E-Mail-Adresse eingeben.' };
  }

  if (password.length < 8) {
    return { error: 'Passwort muss mindestens 8 Zeichen lang sein.' };
  }

  const supabase = await createServerClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error) {
    const message = error.message?.toLowerCase() ?? '';
    if (message.includes('already') || message.includes('registered')) {
      return { error: 'Ein Konto mit dieser E-Mail existiert bereits.' };
    }
    if (message.includes('signup') && message.includes('disabled')) {
      return {
        error: 'Registrierung ist derzeit deaktiviert. Bitte wende dich an einen Administrator.',
      };
    }
    return { error: 'Registrierung fehlgeschlagen. Bitte versuche es erneut.' };
  }

  // Account created but not yet approved — funnel to the waiting screen.
  redirect('/pending');
}
