'use server';

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export type LoginState = {
  error: string | null;
};

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get('email') as string | null;
  const password = formData.get('password') as string | null;

  if (!email || !password) {
    return { error: 'Bitte E-Mail und Passwort eingeben.' };
  }

  const supabase = await createServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message === 'Invalid login credentials') {
      return { error: 'E-Mail oder Passwort ist falsch.' };
    }
    if (error.message === 'Email not confirmed') {
      return { error: 'E-Mail-Adresse wurde noch nicht bestätigt.' };
    }
    return { error: 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.' };
  }

  redirect('/songs');
}

export async function logout(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}
