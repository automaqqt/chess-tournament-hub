'use client';

import { useFormStatus } from 'react-dom';
import { login } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';

// Based on the error, your login action returns one of these two shapes
type LoginState = 
  | { type: string; message: string }
  | { type: string; errors: { username?: string[]; password?: string[] } };

const initialState: LoginState = {
  type: '',
  message: '',
};

function LoginButton() {
  const { pending } = useFormStatus();
  return <Button className="w-full" type="submit" disabled={pending}>{pending ? "Anmelden..." : "Anmelden"}</Button>;
}

export default function LoginForm() {
  const [state, formAction] = useActionState(login, initialState);

  useEffect(() => {
    if (state?.type === 'error') {
      // Check if there's a message property
      if ('message' in state) {
        toast.error(state.message);
      }
      // Handle validation errors
      else if ('errors' in state && state.errors) {
        // Display the first validation error found
        const firstError = Object.values(state.errors).find(err => err && err.length > 0);
        if (firstError && firstError[0]) {
          toast.error(firstError[0]);
        }
      }
    }
  }, [state]);

  return (
    <form action={formAction}>
      <Card className="bg-transparent border-none shadow-none">
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Benutzername</Label>
            <Input id="username" name="username" required />
            {state?.type === 'error' && 'errors' in state && state.errors?.username && (
              <p className="text-red-500 text-sm">{state.errors.username[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input id="password" name="password" type="password" required />
            {state?.type === 'error' && 'errors' in state && state.errors?.password && (
              <p className="text-red-500 text-sm">{state.errors.password[0]}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <LoginButton />
        </CardFooter>
      </Card>
    </form>
  );
}