'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { signup, type RegisterState } from '@/app/(auth)/register/actions';

const initialState: RegisterState = { error: null };

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(signup, initialState);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Konto erstellen</CardTitle>
        <CardDescription>
          Registriere dich – ein Administrator gibt dein Konto anschließend frei.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Name</Label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              placeholder="Max Mustermann"
              autoComplete="name"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Mindestens 8 Zeichen"
              autoComplete="new-password"
              required
              disabled={isPending}
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" className="w-full min-h-[48px]" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrieren …
              </>
            ) : (
              'Registrieren'
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Bereits ein Konto?{' '}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Anmelden
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
