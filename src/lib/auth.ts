import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users } from './schema';
import { eq } from 'drizzle-orm';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // NextAuth v5 — trustHost requis derrière les proxies (Netlify, Vercel, etc.)
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',        type: 'email'    },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        const email    = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) {
          console.warn('[auth] authorize: missing email or password');
          return null;
        }

        // Admin via variables d'environnement
        if (process.env.ADMIN_EMAIL) {
          if (email === process.env.ADMIN_EMAIL) {
            if (password === process.env.ADMIN_PASSWORD) {
              console.info('[auth] admin login OK:', email);
              return { id: '0', name: 'Admin', email, role: 'admin' };
            }
            console.warn('[auth] admin email match but wrong password');
            // Ne pas tomber sur la DB si l'email correspond à l'admin
            return null;
          }
        } else {
          console.warn('[auth] ADMIN_EMAIL not set in env');
        }

        // Utilisateur en base
        try {
          const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
          if (!user) { console.warn('[auth] user not found:', email); return null; }
          if (!user.active) { console.warn('[auth] user inactive:', email); return null; }
          const valid = await bcrypt.compare(password, user.password);
          if (!valid) { console.warn('[auth] wrong password for:', email); return null; }
          console.info('[auth] user login OK:', email, 'role:', user.role);
          return { id: String(user.id), name: user.name, email: user.email, role: user.role ?? 'client' };
        } catch (err) {
          console.error('[auth] DB error during authorize:', err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string; id?: string }).role = token.role as string;
        (session.user as { role?: string; id?: string }).id   = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
});
