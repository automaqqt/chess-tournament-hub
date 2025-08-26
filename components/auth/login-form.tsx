'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { login } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useEffect } from 'react';
import { toast } from 'sonner';

const initialState = {
  type: '',
  message: '',
};

function LoginButton() {
  const { pending } = useFormStatus();
  return <Button className="w-full" type="submit" disabled={pending}>{pending ? "Signing In..." : "Sign In"}</Button>;
}

export default function LoginForm() {
  const [state, formAction] = useFormState(login, initialState);

  useEffect(() => {
    if (state?.type === 'error') {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction}>
      <Card className="bg-transparent border-none shadow-none">
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
        </CardContent>
        <CardFooter>
          <LoginButton />
        </CardFooter>
      </Card>
    </form>
  );
}