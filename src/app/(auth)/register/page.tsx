import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata = {
  title: 'Registrieren – Songbook',
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <RegisterForm />
    </main>
  );
}
