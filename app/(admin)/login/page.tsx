import LoginForm from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-zinc-900/50 border border-zinc-800 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-merriweather text-primary">Admin-Anmeldung</h1>
          <p className="mt-2 text-muted-foreground">Zugang zum Turnier-Dashboard.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}