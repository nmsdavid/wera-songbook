import { Clock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { logout } from '@/app/(auth)/login/actions';

export function PendingNotice() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-2xl font-bold">Fast geschafft</CardTitle>
        <CardDescription>
          Dein Konto wurde erstellt und wartet auf die Freigabe durch einen
          Administrator. Sobald du freigeschaltet bist, erhältst du Zugriff.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={logout}>
          <Button
            type="submit"
            variant="outline"
            className="w-full min-h-[48px]"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Abmelden
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
