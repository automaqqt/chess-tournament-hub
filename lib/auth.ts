'use server';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

const secretKey = process.env.JWT_SECRET!;
const key = new TextEncoder().encode(secretKey);

export async function signIn(username: string, password: string) {
  // Hardcoded check
  const isAdminUser = username === process.env.ADMIN_USERNAME;
  const isPasswordCorrect = password === process.env.ADMIN_PASSWORD;

  if (isAdminUser && isPasswordCorrect) {
    // Create JWT
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const session = await new SignJWT({ username, isAdmin: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expires)
      .sign(key);

    // Set cookie
    (await
          // Set cookie
          cookies()).set('auth_token', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires,
      sameSite: 'lax',
      path: '/',
    });

    return redirect('/admin/dashboard');
  }

  return { type: 'error', message: 'Invalid username or password.' };
}

export async function logout() {
  (await cookies()).set('auth_token', '', { expires: new Date(0) });
  redirect('/login');
}